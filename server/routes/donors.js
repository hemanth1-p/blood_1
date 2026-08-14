const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, location, availability } = req.query;
    const filter = { role: 'donor', isActive: true };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (location) filter.location = new RegExp(location, 'i');
    if (availability === 'true') filter.isAvailable = true;
    if (availability === 'false') filter.isAvailable = false;

    const donors = await User.find(filter)
      .select('fullName bloodGroup location isAvailable lastDonationDate phone email totalDonations')
      .sort({ isAvailable: -1, fullName: 1 });

    res.json({ success: true, count: donors.length, donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' }).select('-password');
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    res.json({ success: true, donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
