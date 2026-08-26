const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerAdmin, adminLogin, getMe, adminLogout } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('adminSecret').notEmpty().withMessage('Admin secret code is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/login', loginValidation, adminLogin);
router.get('/me', protect, getMe);
router.post('/logout', protect, adminLogout);

module.exports = router;