const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'niche-rfp-tracker' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:8891'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/dist')));

// API Routes
app.use('/api/rfps', require('./api/rfps'));
app.use('/api/dashboard', require('./api/dashboard'));
app.use('/api/alerts', require('./api/alerts'));
app.use('/api/auth', require('./api/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../package.json').version
  });
});

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error(error.message, { stack: error.stack, url: req.url, method: req.method });
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(error.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Niche RFP Tracker running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Dashboard: http://localhost:${PORT}`);
  logger.info(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`
  ╔══════════════════════════════════════╗
  ║     🏗️  NICHE RFP TRACKER READY     ║
  ║                                      ║
  ║  📊 Dashboard: http://localhost:${PORT}  ║
  ║  🔧 API:       http://localhost:${PORT}/api ║
  ║  💾 Database:  SQLite                ║
  ║  🔒 Security:  Enabled               ║
  ╚══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;