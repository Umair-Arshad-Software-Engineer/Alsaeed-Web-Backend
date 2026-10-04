const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

// Multer (kept for future multipart support — optional now)
const storage = multer.memoryStorage();

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
    cb(
      new Error(
        `Only image files are allowed. Got mimetype: ${file.mimetype}`
      )
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('name')
    .isLength({ max: 100 })
    .withMessage('Category name must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only routes
// Note: upload.single('image') is a no-op for JSON requests (multer just skips),
// so this works for BOTH multipart form-data AND JSON body with base64.
router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  categoryValidation,
  createCategory
);

router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('image'),
  categoryValidation,
  updateCategory
);

router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;