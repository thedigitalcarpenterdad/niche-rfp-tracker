const express = require('express');
const router = express.Router();

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For demo purposes, accept any login
    if (email && password) {
      res.json({ 
        success: true,
        token: 'demo-jwt-token',
        user: {
          id: 1,
          email: email,
          name: 'Demo User',
          role: 'admin'
        }
      });
    } else {
      res.status(400).json({ error: 'Email and password required' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user
router.get('/me', (req, res) => {
  res.json({
    id: 1,
    email: 'demo@nichewaterproofing.com',
    name: 'Demo User',
    role: 'admin'
  });
});

module.exports = router;