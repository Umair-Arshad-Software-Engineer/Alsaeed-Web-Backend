// controllers/productController.js
const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// ─────────────────────────────────────────────
//  HELPER: Safely normalize `variants`.
//  Accepts: JSON array, JSON string, or null/undefined.
//  Produces a fixed shape that downstream code can rely on.
// ─────────────────────────────────────────────
const parseVariants = (raw) => {
  if (raw === undefined || raw === null) return [];

  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return [];
    try {
      const parsed = JSON.parse(trimmed);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to parse variants JSON:', trimmed);
      return [];
    }
  } else {
    return [];
  }

  // Normalize every variant so downstream code can rely on a fixed shape
  return arr.map((v) => ({
    label: String(v?.label || '').trim(),
    flavour: String(v?.flavour || '').trim(),
    price: parseFloat(v?.price) || 0,
    saleRate: parseFloat(v?.saleRate) || 0,
    discountApply: v?.discountApply === true || v?.discountApply === 'true',
    discountRate: parseFloat(v?.discountRate) || 0,
  }));
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, isActive, limit = 50, offset = 0 } = req.query;

    const whereClause = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (category) {
      const categoryRecord = await Category.findOne({ where: { name: category } });
      if (categoryRecord) {
        whereClause.categoryId = categoryRecord.id;
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      products: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      saleRate,
      discountApply,
      discountRate,
      category,
      hasVariants,
      variants,
      imageUrl,
      imageFileName,
      imageBase64,
    } = req.body;

    // Find or create category
    let categoryRecord = await Category.findOne({ where: { name: category } });
    if (!categoryRecord) {
      categoryRecord = await Category.create({
        name: category,
        isActive: true,
      });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price) || 0,
      saleRate: parseFloat(saleRate) || 0,
      discountApply: discountApply === true || discountApply === 'true',
      discountRate: parseFloat(discountRate) || 0,
      imageUrl: imageUrl || '',
      imageFileName: imageFileName || '',
      imageBase64: imageBase64 || '',
      hasVariants: hasVariants === true || hasVariants === 'true',
      variants: parseVariants(variants),
      categoryId: categoryRecord.id,
      isActive: true,
    });

    await categoryRecord.increment('productCount');

    const completeProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      product: completeProduct,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      name,
      description,
      price,
      saleRate,
      discountApply,
      discountRate,
      category,
      hasVariants,
      variants,
      isActive,
      imageUrl,
      imageFileName,
      imageBase64,
    } = req.body;

    // Handle category change
    if (category && category !== product.category) {
      const oldCategory = await Category.findByPk(product.categoryId);
      if (oldCategory) {
        await oldCategory.decrement('productCount');
      }

      let newCategory = await Category.findOne({ where: { name: category } });
      if (!newCategory) {
        newCategory = await Category.create({
          name: category,
          isActive: true,
        });
      }
      await newCategory.increment('productCount');
      product.categoryId = newCategory.id;
    }

    // Update product — note: `variants` is only replaced when provided,
    // so partial updates (e.g. toggling isActive) preserve flavours.
    await product.update({
      name: name !== undefined ? name : product.name,
      description:
        description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      saleRate:
        saleRate !== undefined ? parseFloat(saleRate) : product.saleRate,
      discountApply:
        discountApply !== undefined
          ? discountApply === true || discountApply === 'true'
          : product.discountApply,
      discountRate:
        discountRate !== undefined
          ? parseFloat(discountRate)
          : product.discountRate,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
      imageFileName:
        imageFileName !== undefined ? imageFileName : product.imageFileName,
      imageBase64:
        imageBase64 !== undefined ? imageBase64 : product.imageBase64,
      hasVariants:
        hasVariants !== undefined
          ? hasVariants === true || hasVariants === 'true'
          : product.hasVariants,
      variants:
        variants !== undefined ? parseVariants(variants) : product.variants,
      isActive:
        isActive !== undefined
          ? isActive === true || isActive === 'true'
          : product.isActive,
    });

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const category = await Category.findByPk(product.categoryId);
    if (category) {
      await category.decrement('productCount');
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Toggle product status
// @route   PATCH /api/products/:id/toggle-status
// @access  Private (Admin only)
const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.update({
      isActive: !product.isActive,
    });

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
};