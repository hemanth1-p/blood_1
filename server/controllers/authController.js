const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register new donor
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      bloodGroup: req.body.bloodGroup,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      location: req.body.location,
      address: req.body.address || '',
      lastDonationDate: req.body.lastDonationDate || null,
      isAvailable: req.body.isAvailable !== false,
      role: 'donor',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome, Life Saver!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bloodGroup: user.bloodGroup,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user / admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: `Invalid credentials for ${role} login` });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Welcome Back, Life Saver!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bloodGroup: user.bloodGroup,
        role: user.role,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update donor availability
// @route   PUT /api/auth/availability
// @access  Private (Donor)
exports.updateAvailability = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `Availability updated to ${user.isAvailable ? 'Available' : 'Unavailable'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'phone', 'location', 'address', 'bloodGroup', 'gender', 'lastDonationDate'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
