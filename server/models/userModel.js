// ==========================================================
// User model — JSON file store.
// ==========================================================
const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

function enrich(user) {
  if (!user) return null;
  const db = readDb();
  const dept = db.departments.find((d) => d.id === user.department_id);
  const team = db.teams.find((t) => t.id === user.team_id);
  const manager = db.users.find((m) => m.id === user.manager_id);
  const { password_hash, reset_token, reset_token_expires, ...safe } = user;
  return {
    ...safe,
    department_name: dept ? dept.name : null,
    team_name: team ? team.name : null,
    manager_name: manager ? manager.name : null,
  };
}

function matchesFilters(u, { role, teamId, departmentId, status, search } = {}) {
  if (role && u.role !== role) return false;
  if (teamId && u.team_id !== Number(teamId)) return false;
  if (departmentId && u.department_id !== Number(departmentId)) return false;
  if (status && u.status !== status) return false;
  if (search) {
    const s = String(search).toLowerCase();
    const hay = `${u.name || ''} ${u.email || ''} ${u.employee_code || ''}`.toLowerCase();
    if (!hay.includes(s)) return false;
  }
  return true;
}

async function findAll(filters = {}) {
  const rows = readDb().users.filter((u) => matchesFilters(u, filters));
  return rows
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map(enrich);
}

async function findById(id) {
  const user = readDb().users.find((u) => u.id === Number(id));
  return enrich(user);
}

/** Full row including password_hash / reset tokens (auth flows only). */
async function findRawById(id) {
  return readDb().users.find((u) => u.id === Number(id)) || null;
}

async function findByEmail(email) {
  return readDb().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

async function create(data) {
  const id = nextId('users');
  const now = nowIso();
  const user = {
    id,
    employee_code: data.employee_code || null,
    name: data.name,
    email: data.email,
    password_hash: data.password_hash,
    role: data.role,
    department_id: data.department_id || null,
    team_id: data.team_id || null,
    designation: data.designation || null,
    manager_id: data.manager_id || null,
    phone: data.phone || null,
    status: 'active',
    avatar_path: null,
    reset_token: null,
    reset_token_expires: null,
    last_login: null,
    created_at: now,
    updated_at: now,
  };
  await mutate((db) => { db.users.push(user); });
  return findById(id);
}

async function update(id, data) {
  const fields = ['name', 'email', 'role', 'department_id', 'team_id', 'designation', 'manager_id', 'phone', 'status', 'employee_code'];
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (!user) return;
    for (const f of fields) {
      if (data[f] !== undefined) user[f] = data[f];
    }
    user.updated_at = nowIso();
  });
  return findById(id);
}

async function updatePassword(id, password_hash) {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (user) {
      user.password_hash = password_hash;
      user.updated_at = nowIso();
    }
  });
}

async function setResetToken(id, token, expires) {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (user) {
      user.reset_token = token;
      user.reset_token_expires = expires;
    }
  });
}

async function clearResetToken(id) {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (user) {
      user.reset_token = null;
      user.reset_token_expires = null;
    }
  });
}

async function touchLastLogin(id) {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (user) user.last_login = nowIso();
  });
}

async function remove(id) {
  await mutate((db) => {
    db.users = db.users.filter((u) => u.id !== Number(id));
  });
}

async function setAvatar(id, avatarPath) {
  await mutate((db) => {
    const user = db.users.find((u) => u.id === Number(id));
    if (user) user.avatar_path = avatarPath;
  });
}

module.exports = {
  findAll, findById, findRawById, findByEmail, create, update, updatePassword,
  setResetToken, clearResetToken, touchLastLogin, remove, setAvatar,
};
