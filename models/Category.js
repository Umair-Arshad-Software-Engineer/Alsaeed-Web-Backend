const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageBase64: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  imageFileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  imageMime: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'image/jpeg',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  productCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'categories',
});

module.exports = Category;