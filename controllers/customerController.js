const { Customer, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin only)
const getCustomers = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { phone: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      customers: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get customer by phone
// @route   GET /api/customers/phone/:phone
// @access  Private (Admin only)
const getCustomerByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { phone: req.params.phone },
      include: [
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: OrderItem,
              as: 'items',
            },
          ],
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('Get customer by phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get customer stats
// @route   GET /api/customers/stats
// @access  Private (Admin only)
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const totalSpent = await Customer.sum('totalSpent') || 0;

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalSpent,
      },
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerByPhone,
  getCustomerStats,
};