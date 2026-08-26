const { Order, Product, Customer, Category, ContactMessage } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get order stats
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const processingOrders = await Order.count({ where: { status: 'processing' } });
    const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
    
    const totalRevenue = await Order.sum('total', { 
      where: { status: { [Op.in]: ['delivered', 'processing'] } } 
    }) || 0;

    // Get product stats
    const totalProducts = await Product.count({ where: { isActive: true } });
    const totalCategories = await Category.count({ where: { isActive: true } });

    // Get customer stats
    const totalCustomers = await Customer.count();

    // Get contact stats
    const unreadMessages = await ContactMessage.count({ where: { status: 'unread' } });

    // Get recent orders (last 5)
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'orderId', 'customerName', 'total', 'status', 'createdAt', 'date', 'time'],
    });

    // Get low stock products (no stock concept, just get products with low price?)
    // For now, we'll just get recently created products
    const recentProducts = await Product.findAll({
      limit: 5,
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'price', 'imageUrl', 'isActive'],
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalRevenue,
        totalProducts,
        totalCategories,
        totalCustomers,
        unreadMessages,
      },
      recentOrders,
      recentProducts,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get revenue by period
// @route   GET /api/dashboard/revenue
// @access  Private (Admin only)
const getRevenueByPeriod = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Get orders with status delivered or processing
    const orders = await Order.findAll({
      where: { 
        status: { [Op.in]: ['delivered', 'processing'] } 
      },
      attributes: ['total', 'createdAt', 'date'],
    });

    // Group by period
    const revenueData = {};
    const now = new Date();

    orders.forEach(order => {
      let key;
      const date = order.createdAt || new Date(order.date);

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!revenueData[key]) {
        revenueData[key] = 0;
      }
      revenueData[key] += parseFloat(order.total);
    });

    // Convert to array and sort
    const sortedData = Object.entries(revenueData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, revenue]) => ({ period, revenue }));

    res.json({
      success: true,
      data: sortedData,
    });
  } catch (error) {
    console.error('Get revenue by period error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date - startOfYear;
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
}

module.exports = {
  getDashboardStats,
  getRevenueByPeriod,
};