const express = require('express');
const { body } = require('express-validator');
const BloodRequest = require('../models/BloodRequest');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  [
    body('patientName').trim().notEmpty().withMessage('Patient name is required'),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group required'),
    body('unitsRequired').isInt({ min: 1 }).withMessage('At least 1 unit required'),
    body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
    body('requiredDate').isISO8601().withMessage('Valid required date needed'),
    body('emergencyLevel').optional().isIn(['Critical', 'High', 'Medium', 'Low']),
  ],
  validate,
  async (req, res) => {
    try {
      const request = await BloodRequest.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Emergency blood request submitted successfully!',
        request,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const { status, emergencyLevel, bloodGroup } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (emergencyLevel) filter.emergencyLevel = emergencyLevel;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/urgent', async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      status: { $in: ['Pending', 'In Progress'] },
    })
      .sort({ emergencyLevel: 1, createdAt: -1 })
      .limit(15);
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Pending, In Progress, Completed, or Cancelled)',
      });
    }

    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: `Request status updated to "${status}"`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: 'Blood request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
