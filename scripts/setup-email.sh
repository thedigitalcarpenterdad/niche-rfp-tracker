#!/bin/bash

# =================================
# EMAIL SETUP SCRIPT FOR RFP TRACKER
# =================================

echo "🔧 Setting up email access for RFP tracking..."

# Create himalaya config directory
mkdir -p ~/.config/himalaya/

# Interactive setup
read -p "📧 Enter joshua@nichewaterproofing.com app password: " -s JOSHUA_PASS
echo
read -p "📧 Enter bd@nichewaterproofing.com app password: " -s BD_PASS
echo

# Create configuration file
cat > ~/.config/himalaya/config.toml << EOF
# Niche RFP Tracker Email Configuration

[accounts.joshua]
email = "joshua@nichewaterproofing.com"
display-name = "Joshua - Niche Waterproofing"
default = true

backend.type = "imap"
backend.host = "imap.gmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "joshua@nichewaterproofing.com"
backend.auth.type = "password"
backend.auth.raw = "$JOSHUA_PASS"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.gmail.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "joshua@nichewaterproofing.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.raw = "$JOSHUA_PASS"

[accounts.bd]
email = "bd@nichewaterproofing.com"
display-name = "BD - Niche Waterproofing"

backend.type = "imap"
backend.host = "imap.gmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "bd@nichewaterproofing.com"
backend.auth.type = "password"
backend.auth.raw = "$BD_PASS"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.gmail.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "bd@nichewaterproofing.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.raw = "$BD_PASS"
EOF

echo "✅ Email configuration created!"
echo "🔍 Testing connection..."

# Test connection
if himalaya envelope list --page-size 1 > /dev/null 2>&1; then
    echo "✅ Email connection successful!"
    echo "🚀 Ready to search for RFPs!"
else
    echo "❌ Connection failed. Please check credentials."
    exit 1
fi
EOF