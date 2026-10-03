// controllers/orderController.js
const { Order, OrderItem, Product, Customer, User } = require('../models');
const { generateOrderId, formatTimestamp } = require('../utils/helpers');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin only)
const getOrders = async (req, res) => {
  try {
    const { status, date, limit = 50, offset = 0 } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (date) whereClause.date = date;

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: OrderItem, as: 'items' },
        { model: Customer, as: 'customer' },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'email'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      orders: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (Admin only)
const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: Customer, as: 'customer' },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      postalCode,
      items,
      subtotal,
      discount,
      total,
    } = req.body;

    const orderId = generateOrderId();
    const now = new Date();
    const { date, time } = formatTimestamp(now.getTime());

    // Find or create customer
    let customer = await Customer.findOne({ where: { phone: customerPhone } });
    if (!customer) {
      customer = await Customer.create({
        phone: customerPhone,
        name: customerName,
        email: customerEmail || '',
        address: customerAddress,
        orderCount: 0,
        totalSpent: 0,
      });
    } else {
      await customer.update({
        name: customerName || customer.name,
        email: customerEmail || customer.email,
        address: customerAddress || customer.address,
      });
    }

    // Create order
    const order = await Order.create({
      orderId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      customerAddress,
      postalCode: postalCode || '',
      subtotal,
      discount: discount || 0,
      total,
      status: 'pending',
      paymentStatus: 'awaiting_confirmation',
      date,
      time,
      timestamp: now.getTime(),
      customerId: customer.id,
    });

    // Create order items
    const orderItems = [];
    for (const item of items) {
      let product = null;
      if (item.originalProductId || item.id) {
        product = await Product.findByPk(item.originalProductId || item.id);
      }

      const orderItem = await OrderItem.create({
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        discountRate: item.discountRate || 0,
        discountApply: item.discountApply || false,
        finalPrice: item.finalPrice || item.price,
        totalPrice: item.totalPrice || item.price * item.quantity,
        // ── Variant context ──
        variantLabel: item.variantLabel || '',
        flavour: item.flavour || '', // ← NEW
        originalProductId: item.originalProductId || item.id || null,
        orderId: order.id,
        productId: product ? product.id : null,
      });
      orderItems.push(orderItem);
    }

    // Update customer stats
    await customer.increment('orderCount');
    await customer.increment('totalSpent', { by: total });
    await customer.update({ lastOrderDate: now });

    // Re-fetch with items so the client gets the persisted versions
    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    res.status(201).json({
      success: true,
      order: fullOrder,
      items: orderItems,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ status, adminId: req.user.id });
    res.json({ success: true, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private (Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ paymentStatus, adminId: req.user.id });
    res.json({ success: true, order });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Admin only)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const processingOrders = await Order.count({ where: { status: 'processing' } });
    const deliveredOrders = await Order.count({ where: { status: 'delivered' } });

    const totalRevenue =
      (await Order.sum('total', {
        where: { status: { [Op.in]: ['delivered', 'processing'] } },
      })) || 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
};