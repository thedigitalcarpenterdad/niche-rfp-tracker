const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const RFP = require('../models/RFP');

// Basic validation function (we'll implement the service later)
const validateRFP = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate && !data.name) errors.push('Name is required');
  if (!isUpdate && !data.deadline) errors.push('Deadline is required');
  if (data.deadline && new Date(data.deadline) < new Date()) errors.push('Deadline must be in the future');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Basic alert function (we'll implement the service later)
const sendAlert = async (type, rfp) => {
  console.log(`Alert: ${type} for RFP: ${rfp.name}`);
};

// GET /api/rfps - Get all RFPs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      urgency, 
      page = 1, 
      limit = 50,
      search,
      sortBy = 'deadline',
      sortOrder = 'asc'
    } = req.query;

    const options = {
      where: {},
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sortBy, sortOrder.toUpperCase()]]
    };

    // Apply filters
    if (status) {
      options.where.status = status;
    }
    
    if (urgency) {
      options.where.urgency_level = urgency;
    }

    if (search) {
      options.where = {
        ...options.where,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { contact: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const rfps = await RFP.findAndCountAll(options);
    
    res.json({
      rfps: rfps.rows,
      totalCount: rfps.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(rfps.count / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rfps/:id - Get single RFP
router.get('/:id', async (req, res) => {
  try {
    const rfp = await RFP.findByPk(req.params.id);
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }
    
    res.json(rfp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rfps - Create new RFP
router.post('/', async (req, res) => {
  try {
    const validation = validateRFP(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const rfp = await RFP.create({
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Send alert for urgent RFPs
    if (rfp.urgency_level === 'urgent' || rfp.urgency_level === 'overdue') {
      await sendAlert('new_urgent_rfp', rfp);
    }

    res.status(201).json(rfp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/rfps/:id - Update RFP
router.put('/:id', async (req, res) => {
  try {
    const rfp = await RFP.findByPk(req.params.id);
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const validation = validateRFP(req.body, true); // Allow partial updates
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    await rfp.update({
      ...req.body,
      updated_at: new Date()
    });

    res.json(rfp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/rfps/:id - Delete RFP
router.delete('/:id', async (req, res) => {
  try {
    const rfp = await RFP.findByPk(req.params.id);
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    await rfp.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rfps/:id/status - Update RFP status
router.post('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const rfp = await RFP.findByPk(req.params.id);
    
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    await rfp.update({
      status,
      notes: notes || rfp.notes,
      updated_at: new Date()
    });

    // Log status change
    await RFP.addStatusHistory(rfp.id, status, notes);

    res.json(rfp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rfps/stats/summary - Get RFP statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await RFP.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;