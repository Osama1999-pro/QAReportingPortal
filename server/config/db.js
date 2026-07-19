// ==========================================================
// MySQL connection pool (mysql2/promise).
// All models import { pool } from here and use parameterized
// queries ONLY — this is what protects the app from SQL injection.
// ==========================================================
const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[db] MySQL connection pool established.');
  } catch (err) {
    console.error('[db] Failed to connect to MySQL:', err.message);
    console.error('[db] Check your .env DB_* values and that MySQL is running.');
  }
}

module.exports = { pool, testConnection };
