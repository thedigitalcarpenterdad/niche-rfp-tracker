const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || 'sqlite:///./data/rfp_tracker.db';

// Parse database URL
let sequelize;

if (databaseUrl.startsWith('sqlite:')) {
  const dbPath = databaseUrl.replace('sqlite:///', '');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(dbPath),
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      timestamps: false // We handle timestamps manually
    }
  });
} else {
  // PostgreSQL/MySQL support for production
  sequelize = new Sequelize(databaseUrl, {
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      timestamps: false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = sequelize;