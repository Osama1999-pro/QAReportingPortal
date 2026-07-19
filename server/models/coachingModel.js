const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT c.*, e.name AS employee_name, co.name AS coach_name, ev.evaluation_code
  FROM coaching_sessions c
  JOIN users e ON e.id = c.employee_id
  JOIN users co ON co.id = c.coach_id
  LEFT JOIN evaluations ev ON ev.id = c.evaluation_id
`;

async function findAll({ employeeId, coachId, status } = {}) {
  const clauses = []; const params = [];
  if (employeeId) { clauses.push('c.employee_id = ?'); params.push(employeeId); }
  if (coachId) { clauses.push('c.coach_id = ?'); params.push(coachId); }
  if (status) { clauses.push('c.status = ?'); params.push(status); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY c.coaching_date DESC`, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE c.id = ?`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const { evaluation_id, employee_id, coach_id, coaching_date, reason, action_plan, follow_up_date } = data;
  const [result] = await pool.query(
    `INSERT INTO coaching_sessions (evaluation_id, employee_id, coach_id, coaching_date, reason, action_plan, follow_up_date)
     VALUES (?,?,?,?,?,?,?)`,
    [evaluation_id || null, employee_id, coach_id, coaching_date, reason, action_plan, follow_up_date || null]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const fields = ['coaching_date', 'reason', 'action_plan', 'follow_up_date', 'status'];
  const sets = []; const params = [];
  for (const f of fields) if (data[f] !== undefined) { sets.push(`${f} = ?`); params.push(data[f]); }
  if (!sets.length) return findById(id);
  params.push(id);
  await pool.query(`UPDATE coaching_sessions SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM coaching_sessions WHERE id = ?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
