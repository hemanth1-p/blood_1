const BloodRequest = require('../models/BloodRequest');

// @desc    Create emergency blood request
// @route   POST /api/requests
// @access  Public
exports.createRequest = async (req, res) => {
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
};

// @desc    Get all blood requests with optional filtering
// @route   GET /api/requests
// @access  Public
exports.getRequests = async (req, res) => {
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
};

// @desc    Get urgent blood requests
// @route   GET /api/requests/urgent
// @access  Public
exports.getUrgentRequests = async (req, res) => {
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
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private (Admin)
exports.updateRequestStatus = async (req, res) => {
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
};

// @desc    Delete blood request
// @route   DELETE /api/requests/:id
// @access  Private (Admin)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, message: 'Blood request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
