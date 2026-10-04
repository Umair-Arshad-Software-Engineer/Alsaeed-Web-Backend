const { Category, Product } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { isActive } = req.query;

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const categories = await Category.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price'],
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    const categoriesWithCount = categories.map((cat) => {
      const plain = cat.toJSON();
      plain.productCount = cat.products ? cat.products.length : 0;
      return plain;
    });

    res.json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'imageUrl', 'imageBase64'],
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Helper — extract image from either multipart file OR base64 in JSON body
function extractImage(req, fallbackBase64 = '', fallbackFileName = '', fallbackMime = 'image/jpeg') {
  // 1. File upload via multer (multipart/form-data)
  if (req.file) {
    return {
      imageBase64: req.file.buffer.toString('base64'),
      imageFileName: req.file.originalname,
      imageMime: req.file.mimetype,
    };
  }

  // 2. Base64 string in JSON body
  if (req.body.imageBase64 !== undefined && req.body.imageBase64 !== null) {
    return {
      imageBase64: req.body.imageBase64 || '',
      imageFileName: req.body.imageFileName || '',
      imageMime: req.body.imageMime || 'image/jpeg',
    };
  }

  // 3. Nothing provided — keep existing values
  return {
    imageBase64: fallbackBase64,
    imageFileName: fallbackFileName,
    imageMime: fallbackMime,
  };
}

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, isActive } = req.body;

    const { imageBase64, imageFileName, imageMime } = extractImage(req);

    // Check if category exists
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists',
      });
    }

    const category = await Category.create({
      name,
      description: description || '',
      imageBase64: imageBase64 || '',
      imageFileName: imageFileName || '',
      imageMime: imageMime || 'image/jpeg',
      isActive: isActive !== undefined ? isActive : true,
      productCount: 0,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, isActive } = req.body;

    const { imageBase64, imageFileName, imageMime } = extractImage(
      req,
      category.imageBase64,
      category.imageFileName,
      category.imageMime
    );

    await category.update({
      name: name || category.name,
      description:
        description !== undefined ? description : category.description,
      imageBase64,
      imageFileName,
      imageMime,
      isActive: isActive !== undefined ? isActive : category.isActive,
    });

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const productCount = await Product.count({
      where: { categoryId: category.id },
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products. Reassign products first.',
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};