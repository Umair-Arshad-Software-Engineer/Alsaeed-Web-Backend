// utils/helpers.js
const SHOP_TIME_ZONE = 'Asia/Karachi';

// Formats any timestamp as Pakistan date/time, regardless of the
// server's own timezone (hosted servers usually run in UTC).
const shopDateParts = (timestamp) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
};

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp.toString().substring(5)}-${random}`;
};

const formatTimestamp = (timestamp) => {
  const { year, month, day, hour, minute } = shopDateParts(timestamp);
  return {
    date: `${year}-${month}-${day}`, // e.g. 2026-10-24 (Pakistan date)
    time: `${hour}:${minute}`,       // e.g. 15:07     (Pakistan time, 24h)
    iso: new Date(timestamp).toISOString(), // ISO stays in UTC, as standard
  };
};

module.exports = {
  generateOrderId,
  formatTimestamp,
  SHOP_TIME_ZONE,
};