const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

async function log(userId, action, details = '', ipAddress = '') {
  try {
    const id = nextId('audit_logs');
    await mutate((db) => {
      db.audit_logs.push({
        id,
        user_id: userId || null,
        action,
        details,
        ip_address: ipAddress,
        created_at: nowIso(),
      });
    });
  } catch (err) {
    console.error('[audit] failed to write log entry:', err.message);
  }
}

async function findAll(limit = 100) {
  const db = readDb();
  return db.audit_logs
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, Number(limit) || 100)
    .map((al) => {
      const user = db.users.find((u) => u.id === al.user_id);
      return { ...al, user_name: user ? user.name : null };
    });
}

module.exports = { log, findAll };
