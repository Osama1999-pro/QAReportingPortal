const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(`
    SELECT t.*, d.name AS department_name
    FROM teams t LEFT JOIN departments d ON d.id = t.department_id
    ORDER BY t.name`);
  return rows;
}
async function create(name, departmentId) {
  const [result] = await pool.query('INSERT INTO teams (name, department_id) VALUES (?,?)', [name, departmentId]);
  return { id: result.insertId, name, department_id: departmentId };
}
async function update(id, name, departmentId) {
  await pool.query('UPDATE teams SET name = ?, department_id = ? WHERE id = ?', [name, departmentId, id]);
  return { id, name, department_id: departmentId };
}
async function remove(id) {
  await pool.query('DELETE FROM teams WHERE id = ?', [id]);
}

module.exports = { findAll, create, update, remove };
