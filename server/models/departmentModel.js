const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

async function findAll() {
  return readDb().departments.slice().sort((a, b) => a.name.localeCompare(b.name));
}

async function create(name) {
  const id = nextId('departments');
  const row = { id, name, created_at: nowIso() };
  await mutate((db) => { db.departments.push(row); });
  return row;
}

async function update(id, name) {
  await mutate((db) => {
    const row = db.departments.find((d) => d.id === Number(id));
    if (row) row.name = name;
  });
  return { id: Number(id), name };
}

async function remove(id) {
  await mutate((db) => {
    db.departments = db.departments.filter((d) => d.id !== Number(id));
  });
}

module.exports = { findAll, create, update, remove };
