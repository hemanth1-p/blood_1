const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createRequest,
  getRequests,
  getUrgentRequests,
  updateRequestStatus,
  deleteRequest,
} = require('../controllers/requestController');

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
  createRequest
);

router.get('/', getRequests);
router.get('/urgent', getUrgentRequests);
router.put('/:id/status', protect, authorize('admin'), updateRequestStatus);
router.delete('/:id', protect, authorize('admin'), deleteRequest);

module.exports = router;
