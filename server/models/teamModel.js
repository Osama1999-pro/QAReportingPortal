const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

async function findAll() {
  const db = readDb();
  return db.teams
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => {
      const dept = db.departments.find((d) => d.id === t.department_id);
      return { ...t, department_name: dept ? dept.name : null };
    });
}

async function create(name, departmentId) {
  const id = nextId('teams');
  const row = { id, name, department_id: departmentId, created_at: nowIso() };
  await mutate((db) => { db.teams.push(row); });
  return row;
}

async function update(id, name, departmentId) {
  await mutate((db) => {
    const row = db.teams.find((t) => t.id === Number(id));
    if (row) {
      row.name = name;
      row.department_id = departmentId;
    }
  });
  return { id: Number(id), name, department_id: departmentId };
}

async function remove(id) {
  await mutate((db) => {
    db.teams = db.teams.filter((t) => t.id !== Number(id));
  });
}

module.exports = { findAll, create, update, remove };
