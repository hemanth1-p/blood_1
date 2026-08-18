const BloodStock = require('../models/BloodStock');
const StockHistory = require('../models/StockHistory');
const { recordStockHistory } = require('../utils/stockHistory');
const { BLOOD_GROUPS } = require('../models/User');

const getStockStatus = (units) => {
  if (units <= 5) return 'Critical';
  if (units <= 15) return 'Low Stock';
  return 'Available';
};

// @desc    Get all blood stock levels
// @route   GET /api/stock
// @access  Public
exports.getStock = async (req, res) => {
  try {
    let stocks = await BloodStock.find().sort({ bloodGroup: 1 });

    if (stocks.length === 0) {
      const initial = BLOOD_GROUPS.map((bg) => ({
        bloodGroup: bg,
        availableUnits: 0,
        reservedUnits: 0,
        expiredUnits: 0,
      }));
      stocks = await BloodStock.insertMany(initial);
    }

    const enriched = stocks.map((s) => ({
      ...s.toObject(),
      stockStatus: getStockStatus(s.availableUnits),
    }));

    res.json({ success: true, stocks: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update stock units
// @route   POST /api/stock
// @access  Private (Admin)
exports.updateStock = async (req, res) => {
  try {
    const { bloodGroup, availableUnits, reservedUnits, expiredUnits } = req.body;
    let stock = await BloodStock.findOne({ bloodGroup });

    if (stock) {
      const prev = stock.availableUnits;
      stock.availableUnits = availableUnits;
      if (reservedUnits !== undefined) stock.reservedUnits = reservedUnits;
      if (expiredUnits !== undefined) stock.expiredUnits = expiredUnits;
      stock.lastUpdated = new Date();
      stock.updatedBy = req.user._id;
      await stock.save();
      await recordStockHistory(bloodGroup, 'Update', availableUnits - prev, prev, availableUnits, req.user._id);
    } else {
      stock = await BloodStock.create({
        bloodGroup,
        availableUnits,
        reservedUnits: reservedUnits || 0,
        expiredUnits: expiredUnits || 0,
        updatedBy: req.user._id,
      });
      await recordStockHistory(bloodGroup, 'Add', availableUnits, 0, availableUnits, req.user._id);
    }

    res.json({
      success: true,
      message: 'Blood stock updated',
      stock: { ...stock.toObject(), stockStatus: getStockStatus(stock.availableUnits) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add units to blood stock
// @route   POST /api/stock/add
// @access  Private (Admin)
exports.addStockUnits = async (req, res) => {
  try {
    const { bloodGroup, units } = req.body;
    let stock = await BloodStock.findOne({ bloodGroup });

    if (!stock) {
      stock = await BloodStock.create({ bloodGroup, availableUnits: units, updatedBy: req.user._id });
      await recordStockHistory(bloodGroup, 'Add', units, 0, units, req.user._id);
    } else {
      const prev = stock.availableUnits;
      stock.availableUnits += units;
      stock.lastUpdated = new Date();
      stock.updatedBy = req.user._id;
      await stock.save();
      await recordStockHistory(bloodGroup, 'Add', units, prev, stock.availableUnits, req.user._id);
    }

    res.json({
      success: true,
      message: `Added ${units} units of ${bloodGroup}`,
      stock: { ...stock.toObject(), stockStatus: getStockStatus(stock.availableUnits) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear stock for blood group
// @route   DELETE /api/stock/:bloodGroup
// @access  Private (Admin)
exports.clearStock = async (req, res) => {
  try {
    const stock = await BloodStock.findOne({ bloodGroup: req.params.bloodGroup });
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    const prev = stock.availableUnits;
    stock.availableUnits = 0;
    stock.lastUpdated = new Date();
    stock.updatedBy = req.user._id;
    await stock.save();
    await recordStockHistory(req.params.bloodGroup, 'Delete', prev, prev, 0, req.user._id);

    res.json({ success: true, message: 'Stock cleared', stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stock history audit log
// @route   GET /api/stock/history
// @access  Private (Admin)
exports.getStockHistory = async (req, res) => {
  try {
    const history = await StockHistory.find()
      .populate('updatedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
