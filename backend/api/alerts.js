const express = require('express');
const router = express.Router();

// POST /api/alerts - Send alert/notification
router.post('/', async (req, res) => {
  try {
    const { type, message, rfp_id, channels } = req.body;
    
    // For now, just log the alert
    console.log('Alert:', { type, message, rfp_id, channels });
    
    res.json({ 
      success: true, 
      message: 'Alert sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts - Get alert history
router.get('/', async (req, res) => {
  try {
    // Return empty array for now
    res.json({ alerts: [], total: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;