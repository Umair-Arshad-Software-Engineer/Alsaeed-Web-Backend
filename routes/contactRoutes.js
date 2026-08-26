const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  submitContactMessage, 
  getContactMessages, 
  markMessageAsRead,
  markMessageAsReplied,
  deleteContactMessage,
  getContactStats,
} = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

// Validation rules
const contactValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('message').notEmpty().withMessage('Message is required'),
];

// Public routes
router.post('/', contactValidation, submitContactMessage);

// Admin only routes
router.get('/', protect, adminOnly, getContactMessages);
router.get('/stats', protect, adminOnly, getContactStats);
router.patch('/:id/read', protect, adminOnly, markMessageAsRead);
router.patch('/:id/replied', protect, adminOnly, markMessageAsReplied);
router.delete('/:id', protect, adminOnly, deleteContactMessage);

module.exports = router;