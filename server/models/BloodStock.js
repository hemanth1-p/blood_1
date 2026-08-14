const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('./User');

const bloodStockSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: true,
      unique: true,
    },
    availableUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiredUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

bloodStockSchema.virtual('stockStatus').get(function () {
  if (this.availableUnits <= 5) return 'Critical';
  if (this.availableUnits <= 15) return 'Low Stock';
  return 'Available';
});

bloodStockSchema.set('toJSON', { virtuals: true });
bloodStockSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BloodStock', bloodStockSchema);
