// ==========================================================
// Global search — a single box that looks across agents, evaluators,
// evaluation codes, ticket numbers, and order numbers.
// ==========================================================
const { pool } = require('../config/db');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ success: true, users: [], evaluations: [] });
    const like = `%${q}%`;

    let userSql = `SELECT id, name, email, role, employee_code FROM users WHERE (name LIKE ? OR email LIKE ? OR employee_code LIKE ?)`;
    const userParams = [like, like, like];

    let evalSql = `
      SELECT e.id, e.evaluation_code, e.ticket_number, e.order_number, e.percentage, e.pass_fail, e.evaluation_date,
             a.name AS agent_name
      FROM evaluations e JOIN users a ON a.id = e.agent_id
      WHERE (e.evaluation_code LIKE ? OR e.ticket_number LIKE ? OR e.order_number LIKE ? OR a.name LIKE ?)`;
    const evalParams = [like, like, like, like];

    if (req.dataScope?.type === 'agent') {
      userSql = 'SELECT id, name, email, role, employee_code FROM users WHERE id = ? AND (name LIKE ? OR email LIKE ?)';
      userParams.length = 0;
      userParams.push(req.dataScope.agentId, like, like);
      evalSql += ' AND e.agent_id = ?';
      evalParams.push(req.dataScope.agentId);
    }
    if (req.dataScope?.type === 'team') {
      evalSql += ' AND e.team_id = ?';
      evalParams.push(req.dataScope.teamId);
    }

    userSql += ' LIMIT 10';
    evalSql += ' ORDER BY e.evaluation_date DESC LIMIT 10';

    const [users] = await pool.query(userSql, userParams);
    const [evaluations] = await pool.query(evalSql, evalParams);

    res.json({ success: true, users, evaluations });
  } catch (err) { next(err); }
}

module.exports = { search };
