// ==========================================================
// JSON file database — reads/writes data/db.json.
// On Vercel the deploy filesystem is read-only, so we copy the
// bundled seed into /tmp and persist writes there for the instance.
// ==========================================================
const fs = require('fs');
const path = require('path');

const BUNDLED_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'qa-portal-data')
  : path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const EMPTY_DB = {
  meta: {
    nextIds: {
      departments: 1,
      teams: 1,
      users: 1,
      evaluations: 1,
      evaluation_scorecard_items: 1,
      coaching_sessions: 1,
      audit_logs: 1,
    },
  },
  departments: [],
  teams: [],
  users: [],
  evaluations: [],
  evaluation_scorecard_items: [],
  coaching_sessions: [],
  settings: {
    id: 1,
    company_name: 'QA Portal',
    logo_path: null,
    qa_pass_percentage: 80,
    theme: 'light',
    updated_at: null,
  },
  audit_logs: [],
};

let cache = null;
let writeQueue = Promise.resolve();

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.existsSync(BUNDLED_PATH)
      ? fs.readFileSync(BUNDLED_PATH, 'utf8')
      : JSON.stringify(EMPTY_DB, null, 2);
    fs.writeFileSync(DB_PATH, seed, 'utf8');
  }
}

function readDb() {
  ensureDataFile();
  if (cache) return cache;
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  cache = JSON.parse(raw);
  return cache;
}

function writeDbSync(db) {
  ensureDataFile();
  cache = db;
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/** Serialize writes so concurrent requests do not clobber each other. */
function update(mutator) {
  writeQueue = writeQueue.then(() => {
    const db = readDb();
    const result = mutator(db);
    writeDbSync(db);
    return result;
  });
  return writeQueue;
}

function nextId(collection) {
  const db = readDb();
  const id = db.meta.nextIds[collection] || 1;
  db.meta.nextIds[collection] = id + 1;
  writeDbSync(db);
  return id;
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function testConnection() {
  try {
    readDb();
    console.log(`[db] JSON store ready at ${DB_PATH}`);
  } catch (err) {
    console.error('[db] Failed to open JSON store:', err.message);
  }
}

module.exports = {
  readDb,
  update,
  nextId,
  nowIso,
  todayDate,
  testConnection,
  DB_PATH,
};
