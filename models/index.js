// models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const ContactMessage = require('./ContactMessage');
const Customer = require('./Customer');
const Branch = require('./Branch'); // Add this

// Associations
// User has many Orders (for admin tracking)
User.hasMany(Order, { foreignKey: 'adminId', as: 'processedOrders' });
Order.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// Category has many Products
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Order has many OrderItems
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product has many OrderItems
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Customer has many Orders
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  User,
  Product,
  Category,
  Order,
  OrderItem,
  ContactMessage,
  Customer,
  Branch, // Add this
};