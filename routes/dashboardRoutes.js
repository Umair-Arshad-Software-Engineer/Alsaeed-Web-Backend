const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  getRevenueByPeriod,
} = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only routes
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/revenue', protect, adminOnly, getRevenueByPeriod);

module.exports = router;