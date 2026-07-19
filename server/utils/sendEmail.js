// ==========================================================
// Nodemailer wrapper. Used for "forgot password" reset links and
// other transactional notifications.
// ==========================================================
const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user) {
    console.warn('[email] SMTP not configured — emails will be logged to the console instead of sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev-mode] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { delivered: false, devMode: true };
  }
  await t.sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.user}>`,
    to,
    subject,
    html,
    text,
  });
  return { delivered: true };
}

async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${config.clientUrl}/reset-password.html?token=${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: 'QA Portal — Reset your password',
    html: `
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your QA Portal password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>`,
    text: `Reset your QA Portal password: ${resetUrl} (expires in 15 minutes)`,
  });
}

module.exports = { sendEmail, sendPasswordResetEmail };
