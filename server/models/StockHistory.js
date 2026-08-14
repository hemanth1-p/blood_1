const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('./User');

const stockHistorySchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: true,
    },
    action: {
      type: String,
      enum: ['Add', 'Update', 'Delete', 'Reserve', 'Expire'],
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    previousUnits: {
      type: Number,
      default: 0,
    },
    newUnits: {
      type: Number,
      default: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockHistory', stockHistorySchema);
