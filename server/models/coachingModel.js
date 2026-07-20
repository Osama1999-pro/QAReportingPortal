const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

function enrich(session) {
  if (!session) return null;
  const db = readDb();
  const employee = db.users.find((u) => u.id === session.employee_id);
  const coach = db.users.find((u) => u.id === session.coach_id);
  const evaluation = db.evaluations.find((e) => e.id === session.evaluation_id);
  return {
    ...session,
    employee_name: employee ? employee.name : null,
    coach_name: coach ? coach.name : null,
    evaluation_code: evaluation ? evaluation.evaluation_code : null,
  };
}

async function findAll({ employeeId, coachId, status } = {}) {
  let rows = readDb().coaching_sessions.slice();
  if (employeeId) rows = rows.filter((c) => c.employee_id === Number(employeeId));
  if (coachId) rows = rows.filter((c) => c.coach_id === Number(coachId));
  if (status) rows = rows.filter((c) => c.status === status);
  return rows
    .sort((a, b) => String(b.coaching_date).localeCompare(String(a.coaching_date)))
    .map(enrich);
}

async function findById(id) {
  const row = readDb().coaching_sessions.find((c) => c.id === Number(id));
  return enrich(row);
}

async function create(data) {
  const id = nextId('coaching_sessions');
  const row = {
    id,
    evaluation_id: data.evaluation_id || null,
    employee_id: data.employee_id,
    coach_id: data.coach_id,
    coaching_date: data.coaching_date,
    reason: data.reason,
    action_plan: data.action_plan,
    follow_up_date: data.follow_up_date || null,
    status: 'pending',
    created_at: nowIso(),
  };
  await mutate((db) => { db.coaching_sessions.push(row); });
  return findById(id);
}

async function update(id, data) {
  const fields = ['coaching_date', 'reason', 'action_plan', 'follow_up_date', 'status'];
  await mutate((db) => {
    const row = db.coaching_sessions.find((c) => c.id === Number(id));
    if (!row) return;
    for (const f of fields) {
      if (data[f] !== undefined) row[f] = data[f];
    }
  });
  return findById(id);
}

async function remove(id) {
  await mutate((db) => {
    db.coaching_sessions = db.coaching_sessions.filter((c) => c.id !== Number(id));
  });
}

module.exports = { findAll, findById, create, update, remove };
