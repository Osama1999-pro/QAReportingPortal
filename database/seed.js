// ==========================================================
// Seed script — run with: npm run seed
// Creates/refreshes the starter departments, teams, and users with a
// REAL bcrypt hash (schema.sql ships a placeholder hash string).
// Safe to run multiple times (uses INSERT ... ON DUPLICATE KEY UPDATE).
// ==========================================================
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../server/config/db');
const config = require('../server/config/config');

const DEFAULT_PASSWORD = 'Password123!';

async function seed() {
  console.log('[seed] Starting...');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, config.bcrypt.saltRounds);

  const conn = await pool.getConnection();
  try {
    await conn.query(`
      INSERT INTO departments (name) VALUES ('Customer Support'), ('E-commerce Operations')
      ON DUPLICATE KEY UPDATE name = VALUES(name)`);

    const [[cs]] = await conn.query(`SELECT id FROM departments WHERE name = 'Customer Support'`);
    const [[ops]] = await conn.query(`SELECT id FROM departments WHERE name = 'E-commerce Operations'`);

    const teams = [
      ['Voice Support', cs.id], ['Live Chat Support', cs.id],
      ['Social Media Support', cs.id], ['Escalations', ops.id],
    ];
    for (const [name, deptId] of teams) {
      await conn.query(
        `INSERT INTO teams (name, department_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE department_id = VALUES(department_id)`,
        [name, deptId]
      );
    }
    const [[voice]] = await conn.query(`SELECT id FROM teams WHERE name = 'Voice Support'`);
    const [[chat]] = await conn.query(`SELECT id FROM teams WHERE name = 'Live Chat Support'`);
    const [[social]] = await conn.query(`SELECT id FROM teams WHERE name = 'Social Media Support'`);

    const users = [
      ['EMP-0001', 'System Administrator', 'admin@qaportal.test', 'super_admin', null, null, 'System Administrator', null, '+92-300-0000001'],
      ['EMP-0002', 'Sara Khan', 'sara.khan@qaportal.test', 'qa_evaluator', cs.id, voice.id, 'QA Evaluator', null, '+92-300-0000002'],
      ['EMP-0003', 'Junaid Sheikh', 'junaid.sheikh@qaportal.test', 'team_lead', cs.id, voice.id, 'Team Lead - Voice', null, '+92-300-0000003'],
      ['EMP-0004', 'Rabia Yousuf', 'rabia.yousuf@qaportal.test', 'team_lead', cs.id, chat.id, 'Team Lead - Chat', null, '+92-300-0000004'],
      ['EMP-0005', 'Bilal Anwar', 'bilal.anwar@qaportal.test', 'agent', cs.id, voice.id, 'Support Agent', null, '+92-300-0000005'],
      ['EMP-0006', 'Ayesha Raza', 'ayesha.raza@qaportal.test', 'agent', cs.id, chat.id, 'Support Agent', null, '+92-300-0000006'],
      ['EMP-0007', 'Hamza Iqbal', 'hamza.iqbal@qaportal.test', 'agent', cs.id, social.id, 'Support Agent', null, '+92-300-0000007'],
    ];

    for (const [code, name, email, role, deptId, teamId, designation, managerId, phone] of users) {
      await conn.query(
        `INSERT INTO users (employee_code, name, email, password_hash, role, department_id, team_id, designation, manager_id, phone)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role),
           department_id = VALUES(department_id), team_id = VALUES(team_id)`,
        [code, name, email, hash, role, deptId, teamId, designation, managerId, phone]
      );
    }

    await conn.query(`
      INSERT INTO settings (id, company_name, qa_pass_percentage, theme) VALUES (1, 'ShopSphere E-commerce', 80.00, 'light')
      ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)`);

    console.log('[seed] Done.');
    console.log('[seed] Login with any seeded email above and password:', DEFAULT_PASSWORD);
    console.log('[seed] CHANGE THE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN.');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
