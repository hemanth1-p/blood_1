const express = require('express');
const { protect } = require('../middleware/auth');
const { searchDonors, getDonorById } = require('../controllers/donorController');

const router = express.Router();

router.get('/search', searchDonors);
router.get('/:id', protect, getDonorById);

module.exports = router;
