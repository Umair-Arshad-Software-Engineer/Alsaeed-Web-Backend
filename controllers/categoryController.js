const sharp = require('sharp');
const { Category, Product, sequelize } = require('../models');
const { validationResult } = require('express-validator');

// ── tiny in-memory cache for the public lite list ──
let liteCache = { at: 0, body: null };
const LITE_TTL = 60 * 1000;
const clearLiteCache = () => {
  liteCache = { at: 0, body: null };
};

// ── shrink uploaded images to ~320px WebP (they display at 92-130px) ──
async function optimizeImage(b64) {
  if (!b64) return null;
  try {
    const raw = b64.replace(/^data:image\/[\w+.-]+;base64,/, '');
    const out = await sharp(Buffer.from(raw, 'base64'))
      .rotate()
      .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { imageBase64: out.toString('base64'), imageMime: 'image/webp' };
  } catch (e) {
    console.error('optimizeImage failed, keeping original:', e.message);
    return null;
  }
}

// @desc    Get all categories
// @route   GET /api/categories   (?lite=1 = fast public list, no images)
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { isActive, lite } = req.query;
    const whereClause = {};
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    // ── FAST PATH: no images, no product join ──
    if (lite === '1') {
      const cacheable = isActive === 'true';
      if (cacheable && liteCache.body && Date.now() - liteCache.at < LITE_TTL) {
        res.set('Cache-Control', 'public, max-age=60');
        return res.json(liteCache.body);
      }

      const rows = await Category.findAll({
        where: whereClause,
        attributes: [
          'id',
          'name',
          'isActive',
          'updatedAt',
          [sequelize.literal('LENGTH(`Category`.`imageBase64`) > 0'), 'hasImage'],
        ],
        order: [['name', 'ASC']],
        raw: true,
      });

      const body = {
        success: true,
        categories: rows.map((c) => ({
          id: c.id,
          name: c.name,
          isActive: !!c.isActive,
          hasImage: !!Number(c.hasImage),
          v: new Date(c.updatedAt).getTime(), // cache-buster for the image URL
        })),
      };
      if (cacheable) liteCache = { at: Date.now(), body };
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(body);
    }

    // ── FULL PATH (admin etc.) — unchanged ──
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

    res.json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get category image as a real, cacheable image
// @route   GET /api/categories/:id/image
// @access  Public
const getCategoryImage = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id, {
      attributes: ['imageBase64', 'imageMime'],
    });
    if (!cat || !cat.imageBase64) return res.status(404).end();

    const raw = cat.imageBase64.replace(/^data:image\/[\w+.-]+;base64,/, '');
    res.set({
      'Content-Type': cat.imageMime || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable', // URL changes via ?v=
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(Buffer.from(raw, 'base64'));
  } catch (error) {
    console.error('Get category image error:', error);
    res.status(500).end();
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
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper — extract image from either multipart file OR base64 in JSON body
function extractImage(req, fallbackBase64 = '', fallbackFileName = '', fallbackMime = 'image/jpeg') {
  if (req.file) {
    return {
      imageBase64: req.file.buffer.toString('base64'),
      imageFileName: req.file.originalname,
      imageMime: req.file.mimetype,
    };
  }
  if (req.body.imageBase64 !== undefined && req.body.imageBase64 !== null) {
    return {
      imageBase64: req.body.imageBase64 || '',
      imageFileName: req.body.imageFileName || '',
      imageMime: req.body.imageMime || 'image/jpeg',
    };
  }
  return {
    imageBase64: fallbackBase64,
    imageFileName: fallbackFileName,
    imageMime: fallbackMime,
  };
}

const imageWasProvided = (req) =>
  !!req.file || (req.body.imageBase64 !== undefined && req.body.imageBase64 !== null);

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
    let { imageBase64, imageFileName, imageMime } = extractImage(req);

    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    if (imageBase64) {
      const opt = await optimizeImage(imageBase64);
      if (opt) ({ imageBase64, imageMime } = opt);
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

    clearLiteCache();
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, isActive } = req.body;

    let { imageBase64, imageFileName, imageMime } = extractImage(
      req,
      category.imageBase64,
      category.imageFileName,
      category.imageMime
    );

    // only re-process when a new image was actually uploaded
    if (imageWasProvided(req) && imageBase64) {
      const opt = await optimizeImage(imageBase64);
      if (opt) ({ imageBase64, imageMime } = opt);
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      imageBase64,
      imageFileName,
      imageMime,
      isActive: isActive !== undefined ? isActive : category.isActive,
    });

    clearLiteCache();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.count({ where: { categoryId: category.id } });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products. Reassign products first.',
      });
    }

    await category.destroy();
    clearLiteCache();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getCategory,
  getCategoryImage,
  createCategory,
  updateCategory,
  deleteCategory,
};