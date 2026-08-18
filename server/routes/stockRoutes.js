const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { BLOOD_GROUPS } = require('../models/User');
const {
  getStock,
  updateStock,
  addStockUnits,
  clearStock,
  getStockHistory,
} = require('../controllers/stockController');

const router = express.Router();

router.get('/', getStock);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('bloodGroup').isIn(BLOOD_GROUPS),
    body('availableUnits').isInt({ min: 0 }),
  ],
  validate,
  updateStock
);

router.post(
  '/add',
  protect,
  authorize('admin'),
  [
    body('bloodGroup').isIn(BLOOD_GROUPS),
    body('units').isInt({ min: 1 }),
  ],
  validate,
  addStockUnits
);

router.delete('/:bloodGroup', protect, authorize('admin'), clearStock);
router.get('/history', protect, authorize('admin'), getStockHistory);

module.exports = router;
