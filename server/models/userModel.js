// ==========================================================
// User model — all queries are parameterized (prevents SQL injection).
// ==========================================================
const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT u.id, u.employee_code, u.name, u.email, u.role, u.department_id, u.team_id,
         u.designation, u.manager_id, u.phone, u.status, u.avatar_path, u.last_login,
         u.created_at, u.updated_at,
         d.name AS department_name, t.name AS team_name, m.name AS manager_name
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN users m ON m.id = u.manager_id
`;

async function findAll({ role, teamId, departmentId, status, search } = {}) {
  const clauses = [];
  const params = [];
  if (role) { clauses.push('u.role = ?'); params.push(role); }
  if (teamId) { clauses.push('u.team_id = ?'); params.push(teamId); }
  if (departmentId) { clauses.push('u.department_id = ?'); params.push(departmentId); }
  if (status) { clauses.push('u.status = ?'); params.push(status); }
  if (search) { clauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY u.created_at DESC`, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE u.id = ?`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function create(data) {
  const { employee_code, name, email, password_hash, role, department_id, team_id, designation, manager_id, phone } = data;
  const [result] = await pool.query(
    `INSERT INTO users (employee_code, name, email, password_hash, role, department_id, team_id, designation, manager_id, phone)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [employee_code || null, name, email, password_hash, role, department_id || null, team_id || null, designation || null, manager_id || null, phone || null]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const fields = ['name', 'email', 'role', 'department_id', 'team_id', 'designation', 'manager_id', 'phone', 'status', 'employee_code'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (data[f] !== undefined) { sets.push(`${f} = ?`); params.push(data[f]); }
  }
  if (!sets.length) return findById(id);
  params.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function updatePassword(id, password_hash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
}

async function setResetToken(id, token, expires) {
  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, id]);
}

async function clearResetToken(id) {
  await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [id]);
}

async function touchLastLogin(id) {
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
}

async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

async function setAvatar(id, avatarPath) {
  await pool.query('UPDATE users SET avatar_path = ? WHERE id = ?', [avatarPath, id]);
}

module.exports = {
  findAll, findById, findByEmail, create, update, updatePassword,
  setResetToken, clearResetToken, touchLastLogin, remove, setAvatar,
};
