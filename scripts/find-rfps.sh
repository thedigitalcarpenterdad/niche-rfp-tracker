#!/bin/bash

# =================================
# FIND REAL RFPS FROM EMAIL
# =================================

echo "🏗️  Finding Real RFPs from Your Email..."
echo "📧 This will search joshua@nichewaterproofing.com and bd@nichewaterproofing.com"
echo ""

# Check if himalaya is configured
if [ ! -f ~/.config/himalaya/config.toml ]; then
    echo "❌ Email not configured yet!"
    echo ""
    echo "🔧 First, run the email setup:"
    echo "   ./scripts/setup-email.sh"
    echo ""
    echo "📧 You'll need app passwords for:"
    echo "   • joshua@nichewaterproofing.com"
    echo "   • bd@nichewaterproofing.com"
    echo ""
    echo "🔑 Get app passwords from: https://myaccount.google.com/apppasswords"
    exit 1
fi

# Test email connection
echo "🔍 Testing email connection..."
if ! himalaya envelope list --page-size 1 > /dev/null 2>&1; then
    echo "❌ Cannot connect to email. Check credentials in ~/.config/himalaya/config.toml"
    exit 1
fi

echo "✅ Email connection successful!"
echo ""

# Clear existing demo data
echo "🗑️  Removing demo data..."
cd "$(dirname "$0")/.."
sqlite3 data/rfp_tracker.db "DELETE FROM rfps;"

# Run the RFP finder
echo "🚀 Searching for real RFPs..."
node email-monitor/rfp-finder.js

echo ""
echo "🎉 Real RFP data loaded!"
echo "📊 Refresh your dashboard to see actual opportunities!"
echo ""
echo "🌐 Dashboard: https://steering-workflow-betting-contents.trycloudflare.com"