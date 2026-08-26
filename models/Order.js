const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  customerName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  customerAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentStatus: {
    type: DataTypes.ENUM('awaiting_confirmation', 'confirmed', 'completed', 'failed'),
    defaultValue: 'awaiting_confirmation',
  },
  date: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  time: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id',
    },
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'orders',
});

module.exports = Order;