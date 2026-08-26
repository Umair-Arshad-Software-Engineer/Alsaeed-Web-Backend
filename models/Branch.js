// models/Branch.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  hours: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tagline: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['Takeaway'],
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '🏪',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'branches',
  timestamps: true,
});

module.exports = Branch;