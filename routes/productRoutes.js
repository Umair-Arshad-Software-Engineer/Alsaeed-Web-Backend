// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
];

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
// NOTE: no multer/upload middleware here — the Flutter app's
// ApiService.createProduct/updateProduct send a plain JSON body
// (Content-Type: application/json), with the image passed as
// `imageUrl` / `imageBase64` string fields rather than a file upload.
router.post('/', protect, adminOnly, productValidation, createProduct);
router.put('/:id', protect, adminOnly, productValidation, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.patch('/:id/toggle-status', protect, adminOnly, toggleProductStatus);

module.exports = router;