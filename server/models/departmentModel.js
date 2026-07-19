const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
  return rows;
}
async function create(name) {
  const [result] = await pool.query('INSERT INTO departments (name) VALUES (?)', [name]);
  return { id: result.insertId, name };
}
async function update(id, name) {
  await pool.query('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
  return { id, name };
}
async function remove(id) {
  await pool.query('DELETE FROM departments WHERE id = ?', [id]);
}

module.exports = { findAll, create, update, remove };
