#!/bin/bash

# =================================
# NICHE RFP TRACKER SETUP SCRIPT
# =================================

set -e

echo "🏗️  Setting up Niche RFP Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -c2-)
REQUIRED_VERSION="18.0.0"

if ! dpkg --compare-versions "$NODE_VERSION" "ge" "$REQUIRED_VERSION"; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js $REQUIRED_VERSION or newer."
    exit 1
fi

print_status "Node.js version $NODE_VERSION is compatible"

# Create necessary directories
print_info "Creating directory structure..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p database/backups
print_status "Directories created"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating environment configuration..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before starting the server"
else
    print_status "Environment file already exists"
fi

# Install dependencies
print_info "Installing Node.js dependencies..."
npm install
print_status "Dependencies installed"

# Create SQLite database
print_info "Setting up database..."
if [ ! -f rfp_tracker.db ]; then
    sqlite3 rfp_tracker.db < database/schema.sql
    print_status "Database created"
else
    print_status "Database already exists"
fi

# Set up log rotation (Linux/macOS)
if command -v logrotate &> /dev/null; then
    print_info "Setting up log rotation..."
    cat > /tmp/rfp-tracker-logrotate << EOF
$PWD/logs/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644
}
EOF
    sudo mv /tmp/rfp-tracker-logrotate /etc/logrotate.d/rfp-tracker
    print_status "Log rotation configured"
fi

# Create systemd service file (Linux)
if command -v systemctl &> /dev/null && [ "$1" != "--skip-systemd" ]; then
    print_info "Creating systemd service..."
    cat > /tmp/niche-rfp-tracker.service << EOF
[Unit]
Description=Niche RFP Tracker
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
ExecStart=/usr/bin/node backend/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$PWD/.env

[Install]
WantedBy=multi-user.target
EOF
    
    if sudo mv /tmp/niche-rfp-tracker.service /etc/systemd/system/; then
        sudo systemctl daemon-reload
        print_status "Systemd service created"
        print_info "You can start the service with: sudo systemctl start niche-rfp-tracker"
        print_info "Enable auto-start with: sudo systemctl enable niche-rfp-tracker"
    else
        print_warning "Could not create systemd service (insufficient permissions)"
    fi
fi

# Create launchd service file (macOS)
if [[ "$OSTYPE" == "darwin"* ]] && [ "$1" != "--skip-launchd" ]; then
    print_info "Creating macOS launch agent..."
    PLIST_PATH="$HOME/Library/LaunchAgents/com.nichewaterproofing.rfp-tracker.plist"
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nichewaterproofing.rfp-tracker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$PWD/backend/app.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PWD</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>$PWD/logs/launchd.error.log</string>
    <key>StandardOutPath</key>
    <string>$PWD/logs/launchd.out.log</string>
</dict>
</plist>
EOF
    print_status "Launch agent created at $PLIST_PATH"
    print_info "Load with: launchctl load ~/Library/LaunchAgents/com.nichewaterproofing.rfp-tracker.plist"
fi

# Set up cron jobs for monitoring
print_info "Setting up cron jobs..."
CRON_FILE="/tmp/rfp-tracker-cron"
cat > "$CRON_FILE" << EOF
# Niche RFP Tracker - Automated Monitoring
# Check for new RFPs every 5 minutes during business hours
*/5 8-18 * * 1-5 cd $PWD && node automation/cron-jobs/email-monitor.js

# Send daily summary at 8 AM
0 8 * * 1-5 cd $PWD && node automation/reports/daily-summary.js

# Check for urgent deadlines every hour
0 * * * * cd $PWD && node automation/alerts/deadline-check.js

# Weekly backup on Sundays at 2 AM
0 2 * * 0 cd $PWD && ./scripts/backup.sh

# Cleanup old logs monthly
0 3 1 * * cd $PWD && find logs -name "*.log" -mtime +30 -delete
EOF

if crontab -l > /tmp/current-cron 2>/dev/null; then
    cat /tmp/current-cron "$CRON_FILE" | crontab -
else
    crontab "$CRON_FILE"
fi
rm "$CRON_FILE" /tmp/current-cron 2>/dev/null || true
print_status "Cron jobs configured"

# Test database connection
print_info "Testing database connection..."
if node -e "const db = require('./backend/config/database'); db.authenticate().then(() => console.log('✓ Database connected')).catch(e => { console.error('✗ Database error:', e.message); process.exit(1); })"; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Create initial admin user (if specified)
if [ ! -z "$ADMIN_EMAIL" ] && [ ! -z "$ADMIN_PASSWORD" ]; then
    print_info "Creating admin user..."
    node -e "
        const User = require('./backend/models/User');
        const bcrypt = require('bcrypt');
        
        (async () => {
            const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 12);
            await User.create({
                email: '$ADMIN_EMAIL',
                password: hashedPassword,
                role: 'admin',
                name: 'Administrator'
            });
            console.log('✓ Admin user created');
        })().catch(e => console.log('User might already exist'));
    "
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your configuration"
echo "2. Configure email accounts and notification settings"
echo "3. Start the server with: npm start"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation: ./docs/"
echo "🐛 Issues: https://github.com/thedigitalcarpenterdad/niche-rfp-tracker/issues"
echo ""
echo "Happy RFP tracking! 🏗️"