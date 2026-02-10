const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../config/database');

class RFP extends Model {
  // Calculate urgency level based on deadline
  static getUrgencyLevel(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 2) return 'urgent';
    if (daysLeft <= 7) return 'warning';
    return 'normal';
  }

  // Get dashboard statistics
  static async getStats() {
    const total = await this.count();
    
    const urgencyStats = await this.findAll({
      attributes: [
        'urgency_level',
        [sequelize.fn('COUNT', sequelize.col('urgency_level')), 'count']
      ],
      group: ['urgency_level']
    });

    const statusStats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    const upcomingDeadlines = await this.findAll({
      where: {
        deadline: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      order: [['deadline', 'ASC']],
      limit: 5
    });

    return {
      total,
      urgency: urgencyStats.reduce((acc, curr) => {
        acc[curr.urgency_level] = parseInt(curr.dataValues.count);
        return acc;
      }, { overdue: 0, urgent: 0, warning: 0, normal: 0 }),
      status: statusStats.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.dataValues.count);
        return acc;
      }, {}),
      upcomingDeadlines
    };
  }

  // Add status history entry
  static async addStatusHistory(rfpId, status, notes) {
    // This would typically be in a separate StatusHistory model
    // For now, we'll add it to the RFP notes
    const rfp = await this.findByPk(rfpId);
    if (rfp) {
      const timestamp = new Date().toISOString();
      const historyEntry = `[${timestamp}] Status changed to: ${status}${notes ? ` - ${notes}` : ''}`;
      const updatedNotes = rfp.notes ? `${rfp.notes}\n${historyEntry}` : historyEntry;
      await rfp.update({ notes: updatedNotes });
    }
  }

  // Get RFPs that need alerts
  static async getRFPsNeedingAlerts() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return await this.findAll({
      where: {
        [Op.or]: [
          // Overdue
          {
            deadline: { [Op.lt]: now },
            status: { [Op.not]: 'completed' }
          },
          // Due tomorrow
          {
            deadline: { [Op.between]: [now, tomorrow] },
            status: { [Op.not]: 'completed' }
          },
          // Due within a week and status is unread
          {
            deadline: { [Op.between]: [now, nextWeek] },
            status: 'unread'
          }
        ]
      },
      order: [['deadline', 'ASC']]
    });
  }

  // Instance method to update urgency
  async updateUrgency() {
    const newUrgency = RFP.getUrgencyLevel(this.deadline);
    if (this.urgency_level !== newUrgency) {
      await this.update({ urgency_level: newUrgency });
    }
    return newUrgency;
  }
}

RFP.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: '2020-01-01' // Reasonable minimum date
    }
  },
  walkthrough_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/ // Basic international phone format
    }
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM,
    values: ['unread', 'pending', 'in_progress', 'submitted', 'awarded', 'lost', 'completed'],
    defaultValue: 'unread'
  },
  priority: {
    type: DataTypes.ENUM,
    values: ['low', 'medium', 'high', 'critical'],
    defaultValue: 'medium'
  },
  urgency_level: {
    type: DataTypes.ENUM,
    values: ['normal', 'warning', 'urgent', 'overdue'],
    defaultValue: 'normal'
  },
  estimated_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  bid_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  documents: {
    type: DataTypes.JSON, // Store array of document paths/URLs
    allowNull: true,
    defaultValue: []
  },
  email_source: {
    type: DataTypes.STRING,
    allowNull: true // Email message ID or source
  },
  tags: {
    type: DataTypes.JSON, // Store array of tags
    allowNull: true,
    defaultValue: []
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'RFP',
  tableName: 'rfps',
  timestamps: false, // We manage timestamps manually
  hooks: {
    beforeSave: async (rfp) => {
      // Auto-update urgency level before saving
      rfp.urgency_level = RFP.getUrgencyLevel(rfp.deadline);
      rfp.updated_at = new Date();
    }
  },
  indexes: [
    { fields: ['deadline'] },
    { fields: ['status'] },
    { fields: ['urgency_level'] },
    { fields: ['priority'] },
    { fields: ['created_at'] }
  ]
});

module.exports = RFP;