const express = require('express');
const router = express.Router();
const RFP = require('../models/RFP');

// GET /api/dashboard - Get dashboard summary data
router.get('/', async (req, res) => {
  try {
    const stats = await RFP.getStats();
    
    // Get recent activity
    const recentRFPs = await RFP.findAll({
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await RFP.findAll({
      where: {
        deadline: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Next 14 days
        },
        status: {
          [Op.not]: 'completed'
        }
      },
      order: [['deadline', 'ASC']],
      limit: 10
    });

    res.json({
      timestamp: new Date().toISOString(),
      summary: stats,
      recentRFPs,
      upcomingDeadlines,
      systemStatus: {
        healthy: true,
        version: require('../../package.json').version
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;