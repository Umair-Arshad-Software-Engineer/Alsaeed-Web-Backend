// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  saleRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  discountApply: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  discountRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // Restored: stores base64-encoded images picked via Gallery/Camera
  // in the Flutter admin form. Uses LONGTEXT-equivalent so large
  // compressed images (~500KB base64-encoded) fit without truncation.
  imageBase64: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  imageFileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  hasVariants: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  variants: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('variants');
      if (!raw) return [];
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return Array.isArray(raw) ? raw : [];
    },
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
  },
}, {
  tableName: 'products',
});

module.exports = Product;