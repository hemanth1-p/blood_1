const DonationHistory = require('../models/DonationHistory');
const User = require('../models/User');
const BloodStock = require('../models/BloodStock');
const { recordStockHistory } = require('../utils/stockHistory');

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

// @desc    Get current donor's donation history
// @route   GET /api/donations/my
// @access  Private (Donor)
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await DonationHistory.find({ donor: req.user._id }).sort({ donationDate: -1 });
    res.json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Donor self-logs a donation
// @route   POST /api/donations/self
// @access  Private (Donor)
exports.recordSelfDonation = async (req, res) => {
  try {
    const { hospital, bloodGroup, unitsDonated, location, donationDate, notes } = req.body;
    const donor = await User.findById(req.user._id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }

    const units = parseInt(unitsDonated, 10) || 1;
    const date = donationDate ? new Date(donationDate) : new Date();

    const donation = await DonationHistory.create({
      donor: donor._id,
      donationDate: date,
      hospital: hospital || 'Voluntary Camp / Blood Bank',
      bloodGroup: bloodGroup || donor.bloodGroup || 'O+',
      unitsDonated: units,
      location: location || donor.location || 'Local Clinic',
      status: 'Completed',
      notes: notes || 'Self-logged by donor',
    });

    donor.totalDonations = (donor.totalDonations || 0) + 1;
    donor.livesImpacted = (donor.livesImpacted || 0) + units * 3;
    if (!donor.lastDonationDate || new Date(date) > new Date(donor.lastDonationDate)) {
      donor.lastDonationDate = date;
    }
    await donor.save();

    res.status(201).json({
      success: true,
      message: 'Donation history recorded successfully!',
      donation,
      user: donor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all donations (Admin)
// @route   GET /api/donations
// @access  Private (Admin)
exports.getAllDonations = async (req, res) => {
  try {
    const donations = await DonationHistory.find()
      .populate('donor', 'fullName email bloodGroup')
      .sort({ donationDate: -1 })
      .limit(100);
    res.json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a new donation
// @route   POST /api/donations
// @access  Private (Admin)
exports.recordDonation = async (req, res) => {
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
};

// @desc    Update donation record
// @route   PUT /api/donations/:id
// @access  Private (Admin)
exports.updateDonation = async (req, res) => {
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
};

// @desc    Delete donation record
// @route   DELETE /api/donations/:id
// @access  Private (Admin)
exports.deleteDonation = async (req, res) => {
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
};
