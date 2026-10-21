// backend/utils/orderMailer.js
// Sends an "new order" notification email to the shop owner.
// Requires:  npm install nodemailer
//
// .env
//   MAIL_USER=yourgmail@gmail.com            (Gmail account that SENDS the email)
//   MAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx    (Gmail "App password", not your normal password)
//   ORDER_NOTIFY_TO=umairmughalflh@gmail.com (optional, this is the default)

const nodemailer = require('nodemailer');

const NOTIFY_TO = process.env.ORDER_NOTIFY_TO || 'umairmughalflh@gmail.com';

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD.replace(/\s/g, ''),
    },
  });
  return transporter;
}

// Customer input goes into HTML, so always escape it
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const rs = (n) => `Rs. ${Number(n || 0).toFixed(0)}`;

const variantText = (it) => {
  const bits = [];
  const f = (it.flavour || '').trim();
  const s = (it.variantLabel || '').trim();
  if (f) bits.push(f);
  if (s && s !== f) bits.push(s);
  return bits.join(' · ');
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

function buildEmail(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const placedAt = new Date().toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rowsHtml = items
    .map((it) => {
      const v = variantText(it);
      const unit = Number(it.finalPrice ?? it.price ?? 0);
      const qty = Number(it.quantity || 1);
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;">
            ${esc(it.name)}${
        v
          ? `<div style="font-size:12px;color:#8A7466;">${esc(v)}</div>`
          : ''
      }
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${rs(unit)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${rs(unit * qty)}</td>
        </tr>`;
    })
    .join('');

  const phoneDigits = String(order.customerPhone || '').replace(/\D/g, '');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#2B1A10;">
    <div style="background:#8B3A0F;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <div style="font-size:12px;letter-spacing:2px;opacity:.8;">ALSAEED SWEETS &amp; BAKERS</div>
      <div style="font-size:22px;font-weight:bold;margin-top:4px;">New order received</div>
    </div>

    <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 4px;font-size:12px;color:#8A7466;">ORDER ID</p>
      <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#B5541C;">${esc(order.orderId)}</p>
      <p style="margin:0 0 20px;font-size:12px;color:#8A7466;">Placed: ${esc(placedAt)}</p>

      <table style="width:100%;font-size:14px;margin-bottom:20px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;color:#8A7466;width:110px;">Customer</td><td style="padding:4px 0;font-weight:bold;">${esc(order.customerName)}</td></tr>
        <tr><td style="padding:4px 0;color:#8A7466;">Phone</td><td style="padding:4px 0;font-weight:bold;">${esc(order.customerPhone)}${
    phoneDigits
      ? ` &nbsp;<a href="https://wa.me/${phoneDigits}" style="color:#128C4A;font-size:12px;">WhatsApp</a>`
      : ''
  }</td></tr>
        ${
          order.customerEmail
            ? `<tr><td style="padding:4px 0;color:#8A7466;">Email</td><td style="padding:4px 0;">${esc(order.customerEmail)}</td></tr>`
            : ''
        }
        <tr><td style="padding:4px 0;color:#8A7466;vertical-align:top;">Address</td><td style="padding:4px 0;">${esc(order.customerAddress)}${
    order.postalCode ? ` - ${esc(order.postalCode)}` : ''
  }</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:14px;" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#FFF4EA;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:1px;color:#8A7466;">ITEM</th>
            <th style="padding:8px 10px;text-align:center;font-size:11px;letter-spacing:1px;color:#8A7466;">QTY</th>
            <th style="padding:8px 10px;text-align:right;font-size:11px;letter-spacing:1px;color:#8A7466;">PRICE</th>
            <th style="padding:8px 10px;text-align:right;font-size:11px;letter-spacing:1px;color:#8A7466;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <table style="width:100%;font-size:14px;margin-top:16px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:3px 0;color:#8A7466;">Subtotal</td><td style="padding:3px 0;text-align:right;">${rs(order.subtotal)}</td></tr>
        ${
          Number(order.discount) > 0
            ? `<tr><td style="padding:3px 0;color:#8A7466;">Discount</td><td style="padding:3px 0;text-align:right;color:#2E7D32;">-${rs(order.discount)}</td></tr>`
            : ''
        }
        <tr><td style="padding:10px 0 0;font-size:16px;font-weight:bold;">Total</td><td style="padding:10px 0 0;text-align:right;font-size:22px;font-weight:bold;color:#B5541C;">${rs(order.total)}</td></tr>
      </table>

      <div style="margin-top:20px;padding:12px 14px;background:#FFF4EA;border-radius:8px;font-size:12px;color:#8B3A0F;">
        Payment is by bank transfer. The customer will send the payment screenshot with this Order ID on WhatsApp.
      </div>
    </div>
  </div>`;

  const text = [
    `NEW ORDER ${order.orderId}`,
    `Placed: ${placedAt}`,
    '',
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    order.customerEmail ? `Email: ${order.customerEmail}` : null,
    `Address: ${order.customerAddress}${order.postalCode ? ` - ${order.postalCode}` : ''}`,
    '',
    ...items.map((it) => {
      const v = variantText(it);
      const unit = Number(it.finalPrice ?? it.price ?? 0);
      const qty = Number(it.quantity || 1);
      return `- ${it.name}${v ? ` (${v})` : ''} x${qty} = ${rs(unit * qty)}`;
    }),
    '',
    `Subtotal: ${rs(order.subtotal)}`,
    Number(order.discount) > 0 ? `Discount: -${rs(order.discount)}` : null,
    `TOTAL: ${rs(order.total)}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { html, text };
}

/**
 * Sends the notification. Never throws: a mail problem must not break
 * order placement. Returns true/false so callers can log if they want.
 */
async function sendOrderNotification(order) {
  try {
    const t = getTransporter();
    if (!t) {
      console.warn(
        '[orderMailer] MAIL_USER / MAIL_APP_PASSWORD not set — skipping email'
      );
      return false;
    }

    const { html, text } = buildEmail(order);

    await t.sendMail({
      from: `"Alsaeed Orders" <${process.env.MAIL_USER}>`,
      to: NOTIFY_TO,
      // Hitting "Reply" goes to the customer, if they gave a valid email
      ...(isEmail(order.customerEmail)
        ? { replyTo: order.customerEmail.trim() }
        : {}),
      subject: `New order ${order.orderId} — ${rs(order.total)} — ${String(
        order.customerName || ''
      ).slice(0, 40)}`,
      text,
      html,
    });

    console.log(`[orderMailer] notification sent for ${order.orderId}`);
    return true;
  } catch (err) {
    console.error('[orderMailer] failed to send notification:', err.message);
    return false;
  }
}

module.exports = { sendOrderNotification };