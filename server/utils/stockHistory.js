const StockHistory = require('../models/StockHistory');

const recordStockHistory = async (bloodGroup, action, units, previousUnits, newUnits, updatedBy, notes = '') => {
  await StockHistory.create({
    bloodGroup,
    action,
    units,
    previousUnits,
    newUnits,
    updatedBy,
    notes,
  });
};

module.exports = { recordStockHistory };
