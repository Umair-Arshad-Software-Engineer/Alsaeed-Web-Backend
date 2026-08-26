// routes/branchRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');
const { protect, adminOnly } = require('../middleware/auth');

// Validation rules
const branchValidation = [
  body('name').notEmpty().withMessage('Branch name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('hours').notEmpty().withMessage('Hours are required'),
];

// Public routes
router.get('/', getBranches);
router.get('/:id', getBranch);

// Admin only routes
router.post('/', protect, adminOnly, branchValidation, createBranch);
router.put('/:id', protect, adminOnly, branchValidation, updateBranch);
router.delete('/:id', protect, adminOnly, deleteBranch);

module.exports = router;