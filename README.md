# 🏗️ Niche RFP Tracker

**Professional RFP Tracking & Management System for Niche Waterproofing**

A complete, standalone RFP (Request for Proposal) tracking system with modern web interface, automated monitoring, and intelligent deadline management.

## ✨ Features

### 🎨 Frontend
- **Modern Dashboard:** Beautiful, responsive web interface
- **Real-time Updates:** Live countdown timers and status updates
- **Mobile-First:** Optimized for all devices
- **Professional Branding:** Niche Waterproofing themed design
- **Smart Alerts:** Visual and audio notifications for urgent deadlines

### 🔧 Backend
- **RESTful API:** Complete CRUD operations for RFPs
- **Email Integration:** Automatic email monitoring and parsing
- **Data Persistence:** SQLite database with migration support
- **Authentication:** Secure access controls
- **Webhook Support:** Integration with external systems

### 🤖 Automation
- **Email Scraping:** Automated RFP discovery from email accounts
- **Deadline Monitoring:** Intelligent alerting system
- **Status Updates:** Automatic progress tracking
- **Report Generation:** Automated weekly/monthly summaries
- **Backup System:** Automated data backup and recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Python 3.9+
- SQLite 3+
- Email account access (IMAP/SMTP)

### Installation

```bash
# Clone the repository
git clone https://github.com/thedigitalcarpenterdad/niche-rfp-tracker.git
cd niche-rfp-tracker

# Choose your runtime (Node.js or Python)

# Node.js Setup
npm install
npm run setup
npm start

# OR Python Setup
pip install -r requirements.txt
python setup.py
python app.py

# OR Docker Setup
docker-compose up -d
```

### Configuration

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your settings:
   ```bash
   # Email Configuration
   EMAIL_HOST=imap.gmail.com
   EMAIL_PORT=993
   EMAIL_USER=joshua@nichewaterproofing.com
   EMAIL_PASS=your-app-password

   # Database
   DATABASE_URL=sqlite:///./rfp_tracker.db

   # Notifications
   TELEGRAM_BOT_TOKEN=your-telegram-token
   SLACK_WEBHOOK=your-slack-webhook
   ```

3. Run initial setup:
   ```bash
   ./scripts/setup.sh
   ```

## 📁 Project Structure

```
niche-rfp-tracker/
├── 📱 frontend/           # Modern web dashboard
│   ├── src/
│   ├── public/
│   └── dist/
├── 🔧 backend/            # API server & business logic
│   ├── api/
│   ├── models/
│   ├── services/
│   └── config/
├── 📧 email-monitor/      # Email scraping & parsing
│   ├── scrapers/
│   ├── parsers/
│   └── processors/
├── 🤖 automation/         # Scripts & workflows
│   ├── cron-jobs/
│   ├── alerts/
│   └── reports/
├── 📊 database/           # Schema & migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── 🔨 scripts/            # Setup & maintenance
│   ├── setup.sh
│   ├── backup.sh
│   └── deploy.sh
├── 📚 docs/               # Documentation
└── 🧪 tests/              # Test suites
```

## 🎯 Key Components

### Dashboard Features
- **Overview Cards:** Total, Urgent, Warning, Normal RFPs
- **RFP List:** Detailed view with deadlines and status
- **Search & Filter:** Advanced filtering by date, status, priority
- **Calendar View:** Visual timeline of deadlines and walkthroughs
- **Reports:** Export capabilities for proposals and summaries

### API Endpoints
- `GET /api/rfps` - List all RFPs
- `POST /api/rfps` - Create new RFP
- `PUT /api/rfps/:id` - Update RFP
- `DELETE /api/rfps/:id` - Delete RFP
- `GET /api/dashboard` - Dashboard summary data
- `POST /api/alerts` - Send notifications

### Email Integration
- **Auto-Discovery:** Scans configured email accounts
- **Smart Parsing:** Extracts RFP details from emails
- **Attachment Processing:** Handles PDF documents
- **Schedule Detection:** Identifies deadlines and walkthroughs

## 🔄 Deployment Options

### 1. Local Development
```bash
npm run dev          # Frontend + Backend
npm run frontend     # Frontend only  
npm run backend      # Backend only
```

### 2. Production Server
```bash
./scripts/deploy.sh production
```

### 3. Docker Container
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Cloud Deployment
- **Vercel/Netlify:** Frontend deployment
- **Railway/Heroku:** Full-stack deployment  
- **AWS/GCP:** Enterprise deployment

## 📈 Monitoring & Analytics

- **Uptime Monitoring:** Health checks and alerts
- **Performance Metrics:** Response times and usage stats  
- **Success Tracking:** Win/loss ratios and bid analytics
- **Cost Analysis:** ROI tracking and budget management

## 🔐 Security

- **Environment Variables:** Secure configuration management
- **API Authentication:** JWT token-based security
- **Data Encryption:** Sensitive data protection
- **Access Controls:** Role-based permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- **Documentation:** [docs/](./docs/)
- **Issues:** [GitHub Issues](https://github.com/thedigitalcarpenterdad/niche-rfp-tracker/issues)
- **Email:** joshua@nichewaterproofing.com

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ for Niche Waterproofing**  
*Never miss another RFP opportunity*