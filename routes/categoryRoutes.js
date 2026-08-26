const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

// Configure multer for memory storage (stores file in memory as buffer)
const storage = multer.memoryStorage();

// File filter to only allow images
// File filter to only allow images — check MIME type (not just extension)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed. Got mimetype: ${file.mimetype}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('name').isLength({ max: 100 }).withMessage('Category name must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only routes
router.post(
  '/', 
  protect, 
  adminOnly, 
  upload.single('image'), // 'image' matches the field name in Flutter
  categoryValidation, 
  createCategory
);

router.put(
  '/:id', 
  protect, 
  adminOnly, 
  upload.single('image'), // 'image' matches the field name in Flutter
  categoryValidation, 
  updateCategory
);

router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;