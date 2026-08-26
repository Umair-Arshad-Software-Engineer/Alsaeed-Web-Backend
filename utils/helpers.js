const { v4: uuidv4 } = require('uuid');

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp.toString().substring(5)}-${random}`;
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    iso: date.toISOString(),
  };
};

module.exports = {
  generateOrderId,
  formatTimestamp,
};