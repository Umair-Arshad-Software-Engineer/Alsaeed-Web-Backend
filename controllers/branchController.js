// controllers/branchController.js
const { Branch } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
const getBranches = async (req, res) => {
  try {
    const { isActive } = req.query;

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const branches = await Branch.findAll({
      where: whereClause,
      order: [['order', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Public
const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    res.json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create branch
// @route   POST /api/branches
// @access  Private (Admin only)
const createBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      address,
      phone,
      hours,
      tagline,
      features,
      icon,
      latitude,
      longitude,
      isActive,
      order,
    } = req.body;

    const branch = await Branch.create({
      name,
      address,
      phone,
      hours,
      tagline: tagline || 'Serving you with love',
      features: features || ['Takeaway'],
      icon: icon || '🏪',
      latitude: latitude || null,
      longitude: longitude || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin only)
const updateBranch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const branch = await Branch.findByPk(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    const {
      name,
      address,
      phone,
      hours,
      tagline,
      features,
      icon,
      latitude,
      longitude,
      isActive,
      order,
    } = req.body;

    await branch.update({
      name: name || branch.name,
      address: address || branch.address,
      phone: phone || branch.phone,
      hours: hours || branch.hours,
      tagline: tagline !== undefined ? tagline : branch.tagline,
      features: features !== undefined ? features : branch.features,
      icon: icon !== undefined ? icon : branch.icon,
      latitude: latitude !== undefined ? latitude : branch.latitude,
      longitude: longitude !== undefined ? longitude : branch.longitude,
      isActive: isActive !== undefined ? isActive : branch.isActive,
      order: order !== undefined ? order : branch.order,
    });

    res.json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin only)
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    await branch.destroy();

    res.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
};