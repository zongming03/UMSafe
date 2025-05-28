const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getComplaintSummary);
router.get('/recent', dashboardController.getRecentComplaints);
router.get('/trending', dashboardController.getTrendingCategories);

module.exports = router;
