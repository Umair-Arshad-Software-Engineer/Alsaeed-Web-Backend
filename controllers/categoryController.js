const { Category, Product } = require('../models');
const { Op } = require('sequelize');
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

    // Calculate product count for each category
    const categoriesWithCount = categories.map(cat => {
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
    
    // Handle image upload - file is available in req.file
    let imageBase64 = '';
    let imageFileName = '';
    
    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      imageFileName = req.file.originalname;
    }

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
    
    // Handle image upload - file is available in req.file
    let imageBase64 = category.imageBase64;
    let imageFileName = category.imageFileName;
    
    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      imageFileName = req.file.originalname;
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      imageBase64: imageBase64,
      imageFileName: imageFileName,
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

    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: category.id } });
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