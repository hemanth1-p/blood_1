const express = require('express');
const { getStatistics, getRecentActivity } = require('../controllers/statsController');

const router = express.Router();

router.get('/', getStatistics);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
