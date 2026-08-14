const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['donor', 'admin'],
      default: 'donor',
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: function () {
        return this.role === 'donor';
      },
    },
    dateOfBirth: {
      type: Date,
      required: function () {
        return this.role === 'donor';
      },
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: function () {
        return this.role === 'donor';
      },
    },
    location: {
      type: String,
      required: function () {
        return this.role === 'donor';
      },
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    livesImpacted: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getNextEligibleDate = function () {
  if (!this.lastDonationDate) return new Date();
  const next = new Date(this.lastDonationDate);
  next.setDate(next.getDate() + 90);
  return next;
};

module.exports = mongoose.model('User', userSchema);
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
