const { readDb, update: mutate, nowIso } = require('../config/jsonStore');

async function get() {
  return readDb().settings || null;
}

async function update(data) {
  const fields = ['company_name', 'qa_pass_percentage', 'theme', 'logo_path'];
  await mutate((db) => {
    if (!db.settings) {
      db.settings = {
        id: 1,
        company_name: 'QA Portal',
        logo_path: null,
        qa_pass_percentage: 80,
        theme: 'light',
        updated_at: nowIso(),
      };
    }
    for (const f of fields) {
      if (data[f] !== undefined) db.settings[f] = data[f];
    }
    db.settings.updated_at = nowIso();
  });
  return get();
}

module.exports = { get, update };
