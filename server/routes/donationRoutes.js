const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getMyDonations,
  getAllDonations,
  recordDonation,
  updateDonation,
  deleteDonation,
} = require('../controllers/donationController');

const router = express.Router();

router.get('/my', protect, authorize('donor'), getMyDonations);
router.get('/', protect, authorize('admin'), getAllDonations);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('donorId').notEmpty().withMessage('Donor ID is required'),
    body('hospital').trim().notEmpty().withMessage('Hospital is required'),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('unitsDonated').isInt({ min: 1 }),
    body('location').trim().notEmpty(),
  ],
  validate,
  recordDonation
);

router.put('/:id', protect, authorize('admin'), updateDonation);
router.delete('/:id', protect, authorize('admin'), deleteDonation);

module.exports = router;
