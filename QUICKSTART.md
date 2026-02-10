# 🚀 Quick Start Guide

Get your Niche RFP Tracker running in under 5 minutes!

## 📋 Prerequisites
- Node.js 18+ installed
- Git installed
- Email account with IMAP access

## ⚡ Installation

### Option 1: Git Clone (Recommended)
```bash
git clone https://github.com/thedigitalcarpenterdad/niche-rfp-tracker.git
cd niche-rfp-tracker
./scripts/setup.sh
```

### Option 2: Download ZIP
1. Download from: https://github.com/thedigitalcarpenterdad/niche-rfp-tracker/archive/main.zip
2. Extract and run setup:
```bash
cd niche-rfp-tracker-main
./scripts/setup.sh
```

### Option 3: Docker (Instant Setup)
```bash
git clone https://github.com/thedigitalcarpenterdad/niche-rfp-tracker.git
cd niche-rfp-tracker
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

## 🔧 Configuration

1. **Edit Environment File:**
```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

2. **Essential Settings:**
```bash
# Email Configuration
EMAIL_USER=joshua@nichewaterproofing.com
EMAIL_PASS=your-app-password-here

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=your-bot-token
```

## 🎯 Start the System

```bash
npm start
```

Open your browser to: http://localhost:3000

## 📱 Features Available Immediately

✅ **Dashboard:** Real-time RFP tracking  
✅ **Manual Entry:** Add RFPs via web interface  
✅ **Deadline Alerts:** Visual countdown timers  
✅ **Status Management:** Track progress through workflow  
✅ **Document Storage:** Upload and organize files  

## 🔄 Enable Automation (Optional)

After basic setup, enable these advanced features:

### Email Monitoring
```bash
# Configure email accounts in .env
EMAIL_HOST=imap.gmail.com
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password
```

### Telegram Alerts
1. Create bot: Message @BotFather on Telegram
2. Add token to .env: `TELEGRAM_BOT_TOKEN=your-token`
3. Start chat with your bot to get alerts

### Automated Backups
```bash
# Runs automatically via cron (set up during installation)
./scripts/backup.sh
```

## 🆘 Need Help?

- **Documentation:** [Full docs in /docs folder](./docs/)
- **Issues:** [GitHub Issues](https://github.com/thedigitalcarpenterdad/niche-rfp-tracker/issues)
- **Email:** joshua@nichewaterproofing.com

## 🎉 You're Ready!

Your RFP tracker is now running! Start by:

1. 📝 Adding your first RFP manually
2. 📧 Configuring email monitoring  
3. 🔔 Setting up notifications
4. 📊 Exploring the dashboard features

**Never miss another RFP opportunity! 🏗️**