// ==========================================================
// Seed script — run with: npm run seed
// Resets data/db.json with starter accounts (bcryptjs hashes).
// ==========================================================
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../server/config/config');

const DEFAULT_PASSWORD = 'Password123!';
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function seed() {
  console.log('[seed] Starting...');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, config.bcrypt.saltRounds);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const today = now.slice(0, 10);

  const db = {
    meta: {
      nextIds: {
        departments: 3,
        teams: 5,
        users: 8,
        evaluations: 2,
        evaluation_scorecard_items: 12,
        coaching_sessions: 2,
        audit_logs: 1,
      },
    },
    departments: [
      { id: 1, name: 'Customer Support', created_at: now },
      { id: 2, name: 'E-commerce Operations', created_at: now },
    ],
    teams: [
      { id: 1, name: 'Voice Support', department_id: 1, created_at: now },
      { id: 2, name: 'Live Chat Support', department_id: 1, created_at: now },
      { id: 3, name: 'Social Media Support', department_id: 1, created_at: now },
      { id: 4, name: 'Escalations', department_id: 2, created_at: now },
    ],
    users: [
      ['EMP-0001', 'System Administrator', 'admin@qaportal.test', 'super_admin', null, null, 'System Administrator', null, '+92-300-0000001'],
      ['EMP-0002', 'Sara Khan', 'sara.khan@qaportal.test', 'qa_evaluator', 1, 1, 'QA Evaluator', null, '+92-300-0000002'],
      ['EMP-0003', 'Junaid Sheikh', 'junaid.sheikh@qaportal.test', 'team_lead', 1, 1, 'Team Lead - Voice', null, '+92-300-0000003'],
      ['EMP-0004', 'Rabia Yousuf', 'rabia.yousuf@qaportal.test', 'team_lead', 1, 2, 'Team Lead - Chat', null, '+92-300-0000004'],
      ['EMP-0005', 'Bilal Anwar', 'bilal.anwar@qaportal.test', 'agent', 1, 1, 'Support Agent', 3, '+92-300-0000005'],
      ['EMP-0006', 'Ayesha Raza', 'ayesha.raza@qaportal.test', 'agent', 1, 2, 'Support Agent', 4, '+92-300-0000006'],
      ['EMP-0007', 'Hamza Iqbal', 'hamza.iqbal@qaportal.test', 'agent', 1, 3, 'Support Agent', 3, '+92-300-0000007'],
    ].map(([code, name, email, role, deptId, teamId, designation, managerId, phone], i) => ({
      id: i + 1,
      employee_code: code,
      name,
      email,
      password_hash: hash,
      role,
      department_id: deptId,
      team_id: teamId,
      designation,
      manager_id: managerId,
      phone,
      status: 'active',
      avatar_path: null,
      reset_token: null,
      reset_token_expires: null,
      last_login: null,
      created_at: now,
      updated_at: now,
    })),
    evaluations: [
      {
        id: 1,
        evaluation_code: 'EVAL-100001',
        ticket_number: 'TCK-88231',
        order_number: 'ORD-552310',
        channel: 'Voice',
        agent_id: 5,
        evaluator_id: 2,
        team_lead_id: 3,
        team_id: 1,
        evaluation_date: today,
        total_max_score: 110,
        total_obtained_score: 92,
        percentage: 83.64,
        pass_fail: 'Pass',
        status: 'completed',
        overall_comments: 'Good resolution, minor gap on policy explanation.',
        created_at: now,
        updated_at: now,
      },
    ],
    evaluation_scorecard_items: [
      { id: 1, evaluation_id: 1, section_key: 'greeting', section_label: 'Greeting', max_score: 10, obtained_score: 10, comments: 'Warm and on-brand opening.' },
      { id: 2, evaluation_id: 1, section_key: 'verification', section_label: 'Verification', max_score: 10, obtained_score: 10, comments: 'Correctly verified order and identity.' },
      { id: 3, evaluation_id: 1, section_key: 'empathy', section_label: 'Empathy', max_score: 10, obtained_score: 8, comments: 'Could acknowledge frustration earlier.' },
      { id: 4, evaluation_id: 1, section_key: 'product_knowledge', section_label: 'Product Knowledge', max_score: 10, obtained_score: 9, comments: 'Accurate return policy details.' },
      { id: 5, evaluation_id: 1, section_key: 'grammar', section_label: 'Grammar', max_score: 10, obtained_score: 9, comments: 'Clear, minor phrasing issue.' },
      { id: 6, evaluation_id: 1, section_key: 'communication', section_label: 'Communication', max_score: 10, obtained_score: 9, comments: 'Clear pacing and tone.' },
      { id: 7, evaluation_id: 1, section_key: 'resolution', section_label: 'Resolution', max_score: 15, obtained_score: 12, comments: 'Resolved but required a follow-up email.' },
      { id: 8, evaluation_id: 1, section_key: 'policy_compliance', section_label: 'Policy Compliance', max_score: 15, obtained_score: 10, comments: 'Missed one disclosure step.' },
      { id: 9, evaluation_id: 1, section_key: 'ownership', section_label: 'Ownership', max_score: 10, obtained_score: 9, comments: 'Took ownership of the delay.' },
      { id: 10, evaluation_id: 1, section_key: 'professionalism', section_label: 'Professionalism', max_score: 5, obtained_score: 5, comments: 'Professional throughout.' },
      { id: 11, evaluation_id: 1, section_key: 'closing', section_label: 'Closing', max_score: 5, obtained_score: 1, comments: 'Rushed close, no confirmation of satisfaction.' },
    ],
    coaching_sessions: [
      {
        id: 1,
        evaluation_id: 1,
        employee_id: 5,
        coach_id: 3,
        coaching_date: today,
        reason: 'Policy compliance score below target on the last 2 evaluations.',
        action_plan: 'Review the return-policy disclosure checklist together and shadow 2 calls this week.',
        follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'pending',
        created_at: now,
      },
    ],
    settings: {
      id: 1,
      company_name: 'ShopSphere E-commerce',
      logo_path: null,
      qa_pass_percentage: 80,
      theme: 'light',
      updated_at: now,
    },
    audit_logs: [],
  };

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log('[seed] Wrote', DB_PATH);
  console.log('[seed] Login: admin@qaportal.test /', DEFAULT_PASSWORD);
  console.log('[seed] CHANGE THE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN.');
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
