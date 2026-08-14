const express = require('express');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const DonationHistory = require('../models/DonationHistory');
const BloodStock = require('../models/BloodStock');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [
      totalDonors,
      activeDonors,
      availableDonors,
      totalRequests,
      pendingRequests,
      completedRequests,
      totalDonations,
      stocks,
      donorsByBloodGroup,
      monthlyDonations,
      requestsByStatus,
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'donor', isActive: true }),
      User.countDocuments({ role: 'donor', isActive: true, isAvailable: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'Pending' }),
      BloodRequest.countDocuments({ status: 'Completed' }),
      DonationHistory.countDocuments({ status: 'Completed' }),
      BloodStock.find(),
      User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      DonationHistory.aggregate([
        {
          $match: {
            donationDate: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$donationDate' },
              month: { $month: '$donationDate' },
            },
            count: { $sum: 1 },
            units: { $sum: '$unitsDonated' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      BloodRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalBloodStock = stocks.reduce((sum, s) => sum + s.availableUnits, 0);
    const livesSaved = await DonationHistory.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$unitsDonated' } } },
    ]);
    const livesSavedCount = (livesSaved[0]?.total || 0) * 3;

    const uniqueHospitals = await DonationHistory.distinct('hospital');
    const emergencyRequests = await BloodRequest.countDocuments({
      emergencyLevel: { $in: ['Critical', 'High'] },
      status: { $in: ['Pending', 'In Progress'] },
    });

    const bloodStockLevels = stocks.map((s) => ({
      bloodGroup: s.bloodGroup,
      available: s.availableUnits,
      reserved: s.reservedUnits,
      status: s.availableUnits <= 5 ? 'Critical' : s.availableUnits <= 15 ? 'Low Stock' : 'Available',
    }));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyDonations.map((m) => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      donations: m.count,
      units: m.units,
    }));

    res.json({
      success: true,
      stats: {
        totalDonors,
        activeDonors,
        availableDonors,
        totalRequests,
        pendingRequests,
        completedRequests,
        emergencyRequests,
        totalBloodStock,
        totalDonations,
        livesSaved: livesSavedCount,
        registeredHospitals: uniqueHospitals.length,
        successfulDonations: totalDonations,
      },
      charts: {
        donorsByBloodGroup: donorsByBloodGroup.map((d) => ({ bloodGroup: d._id, count: d.count })),
        bloodStockLevels,
        monthlyDonations: formattedMonthly,
        requestsByStatus: requestsByStatus.map((r) => ({ status: r._id, count: r.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recent-activity', async (req, res) => {
  try {
    const [recentDonations, recentRequests, recentDonors] = await Promise.all([
      DonationHistory.find()
        .populate('donor', 'fullName bloodGroup')
        .sort({ createdAt: -1 })
        .limit(5),
      BloodRequest.find().sort({ createdAt: -1 }).limit(5),
      User.find({ role: 'donor' }).sort({ createdAt: -1 }).limit(5).select('fullName bloodGroup location createdAt'),
    ]);

    res.json({
      success: true,
      activity: {
        recentDonations,
        recentRequests,
        recentDonors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
