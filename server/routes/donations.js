const express = require('express');
const { body } = require('express-validator');
const DonationHistory = require('../models/DonationHistory');
const User = require('../models/User');
const BloodStock = require('../models/BloodStock');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { recordStockHistory } = require('../utils/stockHistory');

const router = express.Router();

router.get('/my', protect, authorize('donor'), async (req, res) => {
  try {
    const donations = await DonationHistory.find({ donor: req.user._id }).sort({ donationDate: -1 });
    res.json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const donations = await DonationHistory.find()
      .populate('donor', 'fullName email bloodGroup')
      .sort({ donationDate: -1 })
      .limit(100);
    res.json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
  async (req, res) => {
    try {
      const donor = await User.findById(req.body.donorId);
      if (!donor) {
        return res.status(404).json({ success: false, message: 'Donor not found' });
      }

      const donation = await DonationHistory.create({
        donor: donor._id,
        donationDate: req.body.donationDate || new Date(),
        hospital: req.body.hospital,
        bloodGroup: req.body.bloodGroup,
        unitsDonated: req.body.unitsDonated,
        location: req.body.location,
        status: 'Completed',
        notes: req.body.notes || '',
      });

      donor.totalDonations += 1;
      donor.livesImpacted += req.body.unitsDonated * 3;
      donor.lastDonationDate = donation.donationDate;
      await donor.save();

      let stock = await BloodStock.findOne({ bloodGroup: req.body.bloodGroup });
      if (stock) {
        const prev = stock.availableUnits;
        stock.availableUnits += req.body.unitsDonated;
        stock.lastUpdated = new Date();
        stock.updatedBy = req.user._id;
        await stock.save();
        await recordStockHistory(
          req.body.bloodGroup,
          'Add',
          req.body.unitsDonated,
          prev,
          stock.availableUnits,
          req.user._id,
          `Donation from ${donor.fullName} (${req.body.unitsDonated} unit(s))`
        );
      }

      res.status(201).json({ success: true, message: 'Donation recorded', donation });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

const refreshDonorStats = async (donorId) => {
  const donations = await DonationHistory.find({ donor: donorId, status: 'Completed' }).sort({ donationDate: -1 });
  const totalUnits = donations.reduce((sum, d) => sum + (d.unitsDonated || 1), 0);
  const lastDonation = donations.length > 0 ? donations[0].donationDate : null;
  await User.findByIdAndUpdate(donorId, {
    totalDonations: donations.length,
    livesImpacted: totalUnits * 3,
    lastDonationDate: lastDonation,
  });
};

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { hospital, location, unitsDonated, donationDate, status, notes } = req.body;
    const donation = await DonationHistory.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found' });
    }

    const oldUnits = donation.unitsDonated;
    const oldGroup = donation.bloodGroup;

    if (hospital !== undefined) donation.hospital = hospital;
    if (location !== undefined) donation.location = location;
    if (donationDate !== undefined) donation.donationDate = donationDate;
    if (status !== undefined) donation.status = status;
    if (notes !== undefined) donation.notes = notes;

    if (unitsDonated !== undefined && unitsDonated !== oldUnits) {
      donation.unitsDonated = unitsDonated;
      const unitDiff = unitsDonated - oldUnits;
      let stock = await BloodStock.findOne({ bloodGroup: oldGroup });
      if (stock) {
        const prev = stock.availableUnits;
        stock.availableUnits = Math.max(0, stock.availableUnits + unitDiff);
        stock.lastUpdated = new Date();
        stock.updatedBy = req.user._id;
        await stock.save();
        await recordStockHistory(
          oldGroup,
          unitDiff >= 0 ? 'Add' : 'Update',
          Math.abs(unitDiff),
          prev,
          stock.availableUnits,
          req.user._id,
          `Donation adjustment for record ID ${donation._id}`
        );
      }
    }

    await donation.save();
    await refreshDonorStats(donation.donor);

    res.json({ success: true, message: 'Donation history record updated successfully', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const donation = await DonationHistory.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found' });
    }

    await refreshDonorStats(donation.donor);
    res.json({ success: true, message: 'Donation record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
