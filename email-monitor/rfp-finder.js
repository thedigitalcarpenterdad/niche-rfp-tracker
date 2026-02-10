#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const execAsync = promisify(exec);

// RFP-related keywords to search for
const RFP_KEYWORDS = [
    'rfp', 'request for proposal', 'bid opportunity', 'solicitation',
    'construction bid', 'waterproofing', 'facade', 'roofing', 
    'local law 11', 'll11', 'nycha', 'building envelope',
    'masonry', 'caulking', 'sealant', 'restoration',
    'proposal due', 'bid due', 'submission deadline',
    'pre-bid', 'walk through', 'site visit'
];

// Email patterns for different types of RFP notifications
const RFP_PATTERNS = {
    deadline: /(?:due|deadline|submit|proposal).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})/gi,
    walkthrough: /(?:walk[\s\-]?through|site visit|pre[\s\-]?bid).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})/gi,
    value: /\$[\d,]+(?:\.\d{2})?/g,
    contact: /[\w\.-]+@[\w\.-]+\.\w+/g,
    phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
};

class RFPFinder {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/rfp_tracker.db');
    }

    async searchEmails(account = 'joshua', limit = 50) {
        console.log(`🔍 Searching ${account} account for RFPs...`);
        
        try {
            // Search for RFP-related emails in the last 6 months
            const keywords = RFP_KEYWORDS.join(' OR ');
            const searchQuery = `subject "${keywords}" OR body "${keywords}"`;
            
            const { stdout } = await execAsync(
                `himalaya --account ${account} envelope list --page-size ${limit} --output json`
            );
            
            const emails = JSON.parse(stdout);
            console.log(`📬 Found ${emails.length} emails to analyze`);
            
            return emails;
        } catch (error) {
            console.error(`❌ Error searching ${account} emails:`, error.message);
            return [];
        }
    }

    async analyzeEmail(emailId, account = 'joshua') {
        try {
            console.log(`📖 Analyzing email ID: ${emailId}`);
            
            // Get full email content
            const { stdout } = await execAsync(
                `himalaya --account ${account} message read ${emailId}`
            );
            
            // Extract email headers and content
            const emailContent = stdout;
            const rfpData = this.extractRFPData(emailContent, emailId);
            
            return rfpData;
        } catch (error) {
            console.error(`❌ Error analyzing email ${emailId}:`, error.message);
            return null;
        }
    }

    extractRFPData(emailContent, emailId) {
        const lines = emailContent.split('\n');
        let subject = '';
        let from = '';
        let date = '';
        let body = '';
        let inBody = false;
        
        // Parse email structure
        for (const line of lines) {
            if (line.startsWith('Subject:')) {
                subject = line.replace('Subject:', '').trim();
            } else if (line.startsWith('From:')) {
                from = line.replace('From:', '').trim();
            } else if (line.startsWith('Date:')) {
                date = line.replace('Date:', '').trim();
            } else if (line.trim() === '') {
                inBody = true;
            } else if (inBody) {
                body += line + '\n';
            }
        }
        
        // Extract RFP information using patterns
        const deadlines = this.extractDates(body, RFP_PATTERNS.deadline);
        const walkthroughs = this.extractDates(body, RFP_PATTERNS.walkthrough);
        const values = body.match(RFP_PATTERNS.value) || [];
        const contacts = body.match(RFP_PATTERNS.contact) || [];
        const phones = body.match(RFP_PATTERNS.phone) || [];
        
        // Determine if this is likely an RFP
        const isRFP = this.isLikelyRFP(subject, body);
        
        if (isRFP) {
            return {
                email_id: emailId,
                name: this.extractProjectName(subject, body),
                description: this.extractDescription(body),
                deadline: deadlines.length > 0 ? deadlines[0] : null,
                walkthrough_date: walkthroughs.length > 0 ? walkthroughs[0] : null,
                contact: contacts.length > 0 ? contacts[0] : this.extractContactFromFrom(from),
                organization: this.extractOrganization(from, body),
                estimated_value: values.length > 0 ? this.parseValue(values[0]) : null,
                email_source: `${emailId}@${from}`,
                notes: `Imported from email. Subject: ${subject}`,
                raw_content: body.substring(0, 1000) // Store first 1000 chars for reference
            };
        }
        
        return null;
    }

    extractDates(text, pattern) {
        const matches = text.match(pattern) || [];
        return matches.map(match => {
            // Extract date from the match and convert to standard format
            const dateMatch = match.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})/);
            if (dateMatch) {
                try {
                    const date = new Date(dateMatch[1]);
                    return date.toISOString();
                } catch (e) {
                    return null;
                }
            }
            return null;
        }).filter(date => date !== null);
    }

    isLikelyRFP(subject, body) {
        const text = (subject + ' ' + body).toLowerCase();
        const rfpScore = RFP_KEYWORDS.reduce((score, keyword) => {
            return score + (text.includes(keyword.toLowerCase()) ? 1 : 0);
        }, 0);
        
        // Consider it an RFP if it matches at least 2 keywords
        return rfpScore >= 2;
    }

    extractProjectName(subject, body) {
        // Try to extract project name from subject first
        if (subject && subject.length > 10) {
            return subject.substring(0, 100);
        }
        
        // Look for project names in body
        const projectPatterns = [
            /project:?\s*([^\n]{10,100})/i,
            /(?:rfp|bid|proposal).*?for\s+([^\n]{10,100})/i,
            /solicitation.*?:\s*([^\n]{10,100})/i
        ];
        
        for (const pattern of projectPatterns) {
            const match = body.match(pattern);
            if (match && match[1]) {
                return match[1].trim().substring(0, 100);
            }
        }
        
        return 'RFP Opportunity (Email Import)';
    }

    extractDescription(body) {
        // Extract first meaningful paragraph as description
        const paragraphs = body.split('\n\n').filter(p => p.trim().length > 50);
        if (paragraphs.length > 0) {
            return paragraphs[0].substring(0, 500);
        }
        return 'RFP details extracted from email';
    }

    extractContactFromFrom(from) {
        const emailMatch = from.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        return emailMatch ? emailMatch[0] : '';
    }

    extractOrganization(from, body) {
        // Try to extract organization name from email domain or body
        const emailMatch = from.match(/@([\w\.-]+)\./);
        if (emailMatch) {
            const domain = emailMatch[1];
            // Convert domain to organization name
            return domain.split('.').map(part => 
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
        }
        
        // Look for organization patterns in body
        const orgPatterns = [
            /(?:from|contact|organization):\s*([^\n]{5,50})/i,
            /([\w\s&]{5,50})\s+(?:is requesting|requests|invites)/i
        ];
        
        for (const pattern of orgPatterns) {
            const match = body.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return 'Unknown Organization';
    }

    parseValue(valueString) {
        const cleaned = valueString.replace(/[$,]/g, '');
        return parseFloat(cleaned) || null;
    }

    async saveRFP(rfpData) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            const query = `
                INSERT INTO rfps (
                    name, description, deadline, walkthrough_date, contact,
                    organization, estimated_value, email_source, notes,
                    status, priority, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            
            db.run(query, [
                rfpData.name,
                rfpData.description,
                rfpData.deadline,
                rfpData.walkthrough_date,
                rfpData.contact,
                rfpData.organization,
                rfpData.estimated_value,
                rfpData.email_source,
                rfpData.notes
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Saved RFP: ${rfpData.name} (ID: ${this.lastID})`);
                    resolve(this.lastID);
                }
            });
            
            db.close();
        });
    }

    async processAccount(account, limit = 50) {
        console.log(`\n🚀 Processing ${account} account...`);
        
        const emails = await this.searchEmails(account, limit);
        let foundRFPs = 0;
        
        for (const email of emails) {
            const rfpData = await this.analyzeEmail(email.id, account);
            
            if (rfpData) {
                try {
                    await this.saveRFP(rfpData);
                    foundRFPs++;
                } catch (error) {
                    console.error(`❌ Error saving RFP:`, error.message);
                }
            }
        }
        
        console.log(`📊 Found and saved ${foundRFPs} RFPs from ${account} account`);
        return foundRFPs;
    }

    async run() {
        console.log('🏗️  Niche RFP Finder Starting...\n');
        
        try {
            // Process both accounts
            const joshuaRFPs = await this.processAccount('joshua', 100);
            const bdRFPs = await this.processAccount('bd', 100);
            
            const totalRFPs = joshuaRFPs + bdRFPs;
            
            console.log(`\n🎉 Complete! Found ${totalRFPs} total RFPs`);
            console.log('📊 Visit your dashboard to see the real data!');
            
        } catch (error) {
            console.error('❌ Error during RFP search:', error.message);
            console.log('\n💡 Make sure email is configured with: ./scripts/setup-email.sh');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const finder = new RFPFinder();
    finder.run().catch(console.error);
}

module.exports = RFPFinder;