const express = require('express');
const router = express.Router();
const { 
  getCustomers, 
  getCustomerByPhone, 
  getCustomerStats,
} = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only routes
router.get('/', protect, adminOnly, getCustomers);
router.get('/stats', protect, adminOnly, getCustomerStats);
router.get('/phone/:phone', protect, adminOnly, getCustomerByPhone);

module.exports = router;