const { ContactMessage } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// @desc    Submit contact message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      message,
      status: 'unread',
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      contactMessage,
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Admin only)
const getContactMessages = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await ContactMessage.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      messages: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Mark message as read
// @route   PATCH /api/contact/:id/read
// @access  Private (Admin only)
const markMessageAsRead = async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    await message.update({
      status: 'read',
      readAt: new Date(),
    });

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Mark message as replied
// @route   PATCH /api/contact/:id/replied
// @access  Private (Admin only)
const markMessageAsReplied = async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    await message.update({
      status: 'replied',
      readAt: new Date(),
    });

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Mark message as replied error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Admin only)
const deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    await message.destroy();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get contact message stats
// @route   GET /api/contact/stats
// @access  Private (Admin only)
const getContactStats = async (req, res) => {
  try {
    const totalMessages = await ContactMessage.count();
    const unreadMessages = await ContactMessage.count({ where: { status: 'unread' } });
    const repliedMessages = await ContactMessage.count({ where: { status: 'replied' } });

    res.json({
      success: true,
      stats: {
        totalMessages,
        unreadMessages,
        repliedMessages,
      },
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
  markMessageAsRead,
  markMessageAsReplied,
  deleteContactMessage,
  getContactStats,
};