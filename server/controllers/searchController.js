// ==========================================================
// Global search — agents, evaluators, codes, tickets, orders.
// ==========================================================
const { readDb } = require('../config/jsonStore');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 2) return res.json({ success: true, users: [], evaluations: [] });

    const db = readDb();
    let users = db.users.filter((u) => {
      const hay = `${u.name || ''} ${u.email || ''} ${u.employee_code || ''}`.toLowerCase();
      return hay.includes(q);
    });

    let evaluations = db.evaluations.filter((e) => {
      const agent = db.users.find((u) => u.id === e.agent_id);
      const hay = `${e.evaluation_code || ''} ${e.ticket_number || ''} ${e.order_number || ''} ${agent ? agent.name : ''}`.toLowerCase();
      return hay.includes(q);
    });

    if (req.dataScope?.type === 'agent') {
      users = users.filter((u) => u.id === Number(req.dataScope.agentId));
      evaluations = evaluations.filter((e) => e.agent_id === Number(req.dataScope.agentId));
    }
    if (req.dataScope?.type === 'team') {
      evaluations = evaluations.filter((e) => e.team_id === Number(req.dataScope.teamId));
    }

    users = users.slice(0, 10).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      employee_code: u.employee_code,
    }));

    evaluations = evaluations
      .slice()
      .sort((a, b) => String(b.evaluation_date).localeCompare(String(a.evaluation_date)))
      .slice(0, 10)
      .map((e) => {
        const agent = db.users.find((u) => u.id === e.agent_id);
        return {
          id: e.id,
          evaluation_code: e.evaluation_code,
          ticket_number: e.ticket_number,
          order_number: e.order_number,
          percentage: e.percentage,
          pass_fail: e.pass_fail,
          evaluation_date: e.evaluation_date,
          agent_name: agent ? agent.name : null,
        };
      });

    res.json({ success: true, users, evaluations });
  } catch (err) { next(err); }
}

module.exports = { search };
