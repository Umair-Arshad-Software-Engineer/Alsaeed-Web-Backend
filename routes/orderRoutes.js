const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  getOrders, 
  getOrder, 
  createOrder, 
  updateOrderStatus, 
  updatePaymentStatus,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// Validation rules
const orderValidation = [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerPhone').notEmpty().withMessage('Customer phone is required'),
  body('customerAddress').notEmpty().withMessage('Customer address is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('total').isNumeric().withMessage('Total must be a number'),
];

// Public routes
router.post('/', orderValidation, createOrder);

// Admin only routes
router.get('/', protect, adminOnly, getOrders);
router.get('/stats', protect, adminOnly, getOrderStats);
router.get('/:id', protect, adminOnly, getOrder);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);
router.patch('/:id/payment', protect, adminOnly, updatePaymentStatus);

module.exports = router;