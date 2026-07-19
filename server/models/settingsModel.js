const { pool } = require('../config/db');

async function get() {
  const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
  return rows[0] || null;
}

async function update(data) {
  const fields = ['company_name', 'qa_pass_percentage', 'theme', 'logo_path'];
  const sets = []; const params = [];
  for (const f of fields) if (data[f] !== undefined) { sets.push(`${f} = ?`); params.push(data[f]); }
  if (!sets.length) return get();
  await pool.query(`UPDATE settings SET ${sets.join(', ')} WHERE id = 1`, params);
  return get();
}

module.exports = { get, update };
