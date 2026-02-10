-- =================================
-- NICHE RFP TRACKER DATABASE SCHEMA
-- =================================

PRAGMA foreign_keys = ON;

-- RFPs table - Main table for tracking RFP opportunities
CREATE TABLE IF NOT EXISTS rfps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATETIME NOT NULL,
    walkthrough_date DATETIME,
    contact VARCHAR(255),
    contact_phone VARCHAR(50),
    organization VARCHAR(255),
    status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'pending', 'in_progress', 'submitted', 'awarded', 'lost', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'warning', 'urgent', 'overdue')),
    estimated_value DECIMAL(15,2),
    bid_amount DECIMAL(15,2),
    notes TEXT,
    documents JSON DEFAULT '[]',
    email_source VARCHAR(255),
    tags JSON DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rfps_deadline ON rfps(deadline);
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_rfps_urgency ON rfps(urgency_level);
CREATE INDEX IF NOT EXISTS idx_rfps_priority ON rfps(priority);
CREATE INDEX IF NOT EXISTS idx_rfps_created ON rfps(created_at);

-- Users table - For authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'viewer')),
    active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RFP Status History - Track status changes over time
CREATE TABLE IF NOT EXISTS rfp_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfp_id INTEGER NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER,
    notes TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_status_history_rfp ON rfp_status_history(rfp_id);
CREATE INDEX IF NOT EXISTS idx_status_history_date ON rfp_status_history(changed_at);

-- Email Monitoring - Track which emails have been processed
CREATE TABLE IF NOT EXISTS email_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    email_account VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    sender VARCHAR(255),
    processed BOOLEAN DEFAULT FALSE,
    rfp_created BOOLEAN DEFAULT FALSE,
    rfp_id INTEGER,
    error_message TEXT,
    received_at DATETIME NOT NULL,
    processed_at DATETIME,
    FOREIGN KEY (rfp_id) REFERENCES rfps(id)
);

CREATE INDEX IF NOT EXISTS idx_email_monitoring_processed ON email_monitoring(processed);
CREATE INDEX IF NOT EXISTS idx_email_monitoring_received ON email_monitoring(received_at);

-- Notifications - Track sent notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rfp_id INTEGER,
    user_id INTEGER,
    channel VARCHAR(50) NOT NULL, -- 'email', 'telegram', 'slack', 'push'
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfp_id) REFERENCES rfps(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- System Settings - Configuration storage
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents - File attachments and related documents
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfp_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_rfp ON documents(rfp_id);

-- Activity Log - Audit trail for all system activities
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);

-- Views for common queries
CREATE VIEW IF NOT EXISTS rfps_with_urgency AS
SELECT 
    r.*,
    CASE 
        WHEN r.deadline < datetime('now') THEN 'overdue'
        WHEN r.deadline <= datetime('now', '+2 days') THEN 'urgent'
        WHEN r.deadline <= datetime('now', '+7 days') THEN 'warning'
        ELSE 'normal'
    END as calculated_urgency,
    CAST(JULIANDAY(r.deadline) - JULIANDAY('now') AS INTEGER) as days_remaining
FROM rfps r
WHERE r.status != 'completed';

CREATE VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    COUNT(*) as total_rfps,
    COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_rfps,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_rfps,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_rfps,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_rfps,
    COUNT(CASE WHEN deadline < datetime('now') AND status != 'completed' THEN 1 END) as overdue_rfps,
    COUNT(CASE WHEN deadline <= datetime('now', '+2 days') AND status != 'completed' THEN 1 END) as urgent_rfps,
    COUNT(CASE WHEN deadline <= datetime('now', '+7 days') AND status != 'completed' THEN 1 END) as warning_rfps
FROM rfps;

-- Triggers to maintain data integrity and automation

-- Update timestamp trigger for RFPs
CREATE TRIGGER IF NOT EXISTS update_rfps_timestamp 
AFTER UPDATE ON rfps
FOR EACH ROW
BEGIN
    UPDATE rfps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update urgency level trigger
CREATE TRIGGER IF NOT EXISTS update_rfps_urgency 
AFTER UPDATE OF deadline ON rfps
FOR EACH ROW
BEGIN
    UPDATE rfps SET urgency_level = 
        CASE 
            WHEN NEW.deadline < datetime('now') THEN 'overdue'
            WHEN NEW.deadline <= datetime('now', '+2 days') THEN 'urgent'
            WHEN NEW.deadline <= datetime('now', '+7 days') THEN 'warning'
            ELSE 'normal'
        END
    WHERE id = NEW.id;
END;

-- Log status changes trigger
CREATE TRIGGER IF NOT EXISTS log_rfp_status_change
AFTER UPDATE OF status ON rfps
FOR EACH ROW WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO rfp_status_history (rfp_id, old_status, new_status, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
END;

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES 
('email_check_interval', '300', 'Email monitoring interval in seconds'),
('alert_check_interval', '3600', 'Alert checking interval in seconds'),
('urgent_threshold_days', '2', 'Days threshold for urgent classification'),
('warning_threshold_days', '7', 'Days threshold for warning classification'),
('company_name', 'Niche Waterproofing', 'Company name for branding'),
('dashboard_refresh_interval', '30', 'Dashboard auto-refresh interval in seconds'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes'),
('backup_retention_days', '90', 'Number of days to keep database backups');

-- Initial data for development/testing (remove in production)
-- INSERT INTO users (email, password, name, role) VALUES 
-- ('joshua@nichewaterproofing.com', '$2b$12$hash_here', 'Joshua', 'admin');

-- Create full-text search index for RFPs (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS rfps_fts USING fts5(
    name, 
    description, 
    organization, 
    notes,
    content='rfps',
    content_rowid='id'
);

-- Trigger to keep FTS index updated
CREATE TRIGGER IF NOT EXISTS rfps_fts_insert AFTER INSERT ON rfps
BEGIN
    INSERT INTO rfps_fts(rowid, name, description, organization, notes)
    VALUES (NEW.id, NEW.name, NEW.description, NEW.organization, NEW.notes);
END;

CREATE TRIGGER IF NOT EXISTS rfps_fts_delete AFTER DELETE ON rfps
BEGIN
    DELETE FROM rfps_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS rfps_fts_update AFTER UPDATE ON rfps
BEGIN
    DELETE FROM rfps_fts WHERE rowid = OLD.id;
    INSERT INTO rfps_fts(rowid, name, description, organization, notes)
    VALUES (NEW.id, NEW.name, NEW.description, NEW.organization, NEW.notes);
END;

-- Database version info
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_version (version) VALUES (1);

-- Success message
SELECT 'Database schema created successfully! 🎉' as result;