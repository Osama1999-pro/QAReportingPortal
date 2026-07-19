const { pool } = require('../config/db');

async function log(userId, action, details = '', ipAddress = '') {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?,?,?,?)', [userId, action, details, ipAddress]);
  } catch (err) {
    console.error('[audit] failed to write log entry:', err.message);
  }
}

async function findAll(limit = 100) {
  const [rows] = await pool.query(
    `SELECT al.*, u.name AS user_name FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC LIMIT ?`, [limit]);
  return rows;
}

module.exports = { log, findAll };
