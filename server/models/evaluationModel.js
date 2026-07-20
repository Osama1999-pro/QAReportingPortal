// ==========================================================
// Evaluation model — evaluations + scorecard line items (JSON).
// ==========================================================
const { readDb, update: mutate, nextId, nowIso } = require('../config/jsonStore');

function generateEvalCode() {
  return `EVAL-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

function enrich(evaluation) {
  if (!evaluation) return null;
  const db = readDb();
  const agent = db.users.find((u) => u.id === evaluation.agent_id);
  const evaluator = db.users.find((u) => u.id === evaluation.evaluator_id);
  const teamLead = db.users.find((u) => u.id === evaluation.team_lead_id);
  const team = db.teams.find((t) => t.id === evaluation.team_id);
  return {
    ...evaluation,
    agent_name: agent ? agent.name : null,
    agent_code: agent ? agent.employee_code : null,
    evaluator_name: evaluator ? evaluator.name : null,
    team_lead_name: teamLead ? teamLead.name : null,
    team_name: team ? team.name : null,
  };
}

function agentDeptId(evaluation) {
  const agent = readDb().users.find((u) => u.id === evaluation.agent_id);
  return agent ? agent.department_id : null;
}

function matchesFilters(e, filters = {}, dataScope = null) {
  if (filters.agentId && e.agent_id !== Number(filters.agentId)) return false;
  if (filters.evaluatorId && e.evaluator_id !== Number(filters.evaluatorId)) return false;
  if (filters.teamId && e.team_id !== Number(filters.teamId)) return false;
  if (filters.departmentId && agentDeptId(e) !== Number(filters.departmentId)) return false;
  if (filters.channel && e.channel !== filters.channel) return false;
  if (filters.status && e.status !== filters.status) return false;
  if (filters.passFail && e.pass_fail !== filters.passFail) return false;
  if (filters.dateFrom && e.evaluation_date < filters.dateFrom) return false;
  if (filters.dateTo && e.evaluation_date > filters.dateTo) return false;
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    const agent = readDb().users.find((u) => u.id === e.agent_id);
    const hay = `${e.ticket_number || ''} ${e.order_number || ''} ${e.evaluation_code || ''} ${agent ? agent.name : ''}`.toLowerCase();
    if (!hay.includes(s)) return false;
  }
  if (dataScope) {
    if (dataScope.type === 'agent' && e.agent_id !== Number(dataScope.agentId)) return false;
    if (dataScope.type === 'team' && e.team_id !== Number(dataScope.teamId)) return false;
  }
  return true;
}

function filtered(filters = {}, dataScope = null) {
  return readDb().evaluations.filter((e) => matchesFilters(e, filters, dataScope));
}

function buildFilters(filters = {}, dataScope = null) {
  // Kept for API compatibility with callers that previously used SQL builders.
  return { filters, dataScope };
}

async function findAll(filters = {}, dataScope = null, { limit, offset } = {}) {
  let rows = filtered(filters, dataScope)
    .slice()
    .sort((a, b) => {
      const d = String(b.evaluation_date).localeCompare(String(a.evaluation_date));
      return d !== 0 ? d : b.id - a.id;
    })
    .map(enrich);
  if (limit) {
    const start = Number(offset) || 0;
    rows = rows.slice(start, start + Number(limit));
  }
  return rows;
}

async function count(filters = {}, dataScope = null) {
  return filtered(filters, dataScope).length;
}

async function findById(id) {
  const db = readDb();
  const evaluation = db.evaluations.find((e) => e.id === Number(id));
  if (!evaluation) return null;
  const scorecard = db.evaluation_scorecard_items.filter((i) => i.evaluation_id === Number(id));
  return { ...enrich(evaluation), scorecard };
}

async function create(data, scorecard, passPercentage) {
  const totalMax = scorecard.reduce((s, i) => s + Number(i.max_score), 0);
  const totalObtained = scorecard.reduce((s, i) => s + Number(i.obtained_score), 0);
  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const passFail = percentage >= passPercentage ? 'Pass' : 'Fail';
  const code = generateEvalCode();
  const now = nowIso();
  const evalId = nextId('evaluations');

  const evaluation = {
    id: evalId,
    evaluation_code: code,
    ticket_number: data.ticket_number || null,
    order_number: data.order_number || null,
    channel: data.channel,
    agent_id: data.agent_id,
    evaluator_id: data.evaluator_id,
    team_lead_id: data.team_lead_id || null,
    team_id: data.team_id || null,
    evaluation_date: data.evaluation_date,
    total_max_score: totalMax,
    total_obtained_score: totalObtained,
    percentage,
    pass_fail: passFail,
    status: data.status || 'completed',
    overall_comments: data.overall_comments || null,
    created_at: now,
    updated_at: now,
  };

  await mutate((db) => {
    db.evaluations.push(evaluation);
    for (const item of scorecard) {
      const itemId = db.meta.nextIds.evaluation_scorecard_items || 1;
      db.meta.nextIds.evaluation_scorecard_items = itemId + 1;
      db.evaluation_scorecard_items.push({
        id: itemId,
        evaluation_id: evalId,
        section_key: item.section_key,
        section_label: item.section_label,
        max_score: item.max_score,
        obtained_score: item.obtained_score,
        comments: item.comments || null,
      });
    }
  });

  return findById(evalId);
}

async function update(id, data, scorecard, passPercentage) {
  await mutate((db) => {
    const evaluation = db.evaluations.find((e) => e.id === Number(id));
    if (!evaluation) return;

    if (scorecard && scorecard.length) {
      const totalMax = scorecard.reduce((s, i) => s + Number(i.max_score), 0);
      const totalObtained = scorecard.reduce((s, i) => s + Number(i.obtained_score), 0);
      const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      const passFail = percentage >= passPercentage ? 'Pass' : 'Fail';
      evaluation.total_max_score = totalMax;
      evaluation.total_obtained_score = totalObtained;
      evaluation.percentage = percentage;
      evaluation.pass_fail = passFail;

      db.evaluation_scorecard_items = db.evaluation_scorecard_items.filter(
        (i) => i.evaluation_id !== Number(id)
      );
      for (const item of scorecard) {
        const itemId = db.meta.nextIds.evaluation_scorecard_items || 1;
        db.meta.nextIds.evaluation_scorecard_items = itemId + 1;
        db.evaluation_scorecard_items.push({
          id: itemId,
          evaluation_id: Number(id),
          section_key: item.section_key,
          section_label: item.section_label,
          max_score: item.max_score,
          obtained_score: item.obtained_score,
          comments: item.comments || null,
        });
      }
    }

    const fields = ['ticket_number', 'order_number', 'channel', 'agent_id', 'evaluator_id', 'team_lead_id',
      'team_id', 'evaluation_date', 'status', 'overall_comments'];
    for (const f of fields) {
      if (data[f] !== undefined) evaluation[f] = data[f];
    }
    evaluation.updated_at = nowIso();
  });

  return findById(id);
}

async function remove(id) {
  await mutate((db) => {
    db.evaluations = db.evaluations.filter((e) => e.id !== Number(id));
    db.evaluation_scorecard_items = db.evaluation_scorecard_items.filter(
      (i) => i.evaluation_id !== Number(id)
    );
  });
}

async function setStatus(id, status) {
  await mutate((db) => {
    const evaluation = db.evaluations.find((e) => e.id === Number(id));
    if (evaluation) {
      evaluation.status = status;
      evaluation.updated_at = nowIso();
    }
  });
  return findById(id);
}

async function stats(dataScope = null) {
  const rows = filtered({}, dataScope);
  const total = rows.length;
  const avg = total ? rows.reduce((s, e) => s + Number(e.percentage), 0) / total : 0;
  return {
    total_evaluations: total,
    avg_score: total ? Number(avg.toFixed(2)) : 0,
    passed: rows.filter((e) => e.pass_fail === 'Pass').length,
    failed: rows.filter((e) => e.pass_fail === 'Fail').length,
    completed: rows.filter((e) => e.status === 'completed').length,
    pending: rows.filter((e) => e.status === 'draft').length,
  };
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

async function monthlyTrend(dataScope = null, months = 6) {
  const rows = filtered({ dateFrom: monthsAgo(months) }, dataScope);
  const map = new Map();
  for (const e of rows) {
    const period = String(e.evaluation_date).slice(0, 7);
    if (!map.has(period)) map.set(period, { period, sum: 0, total: 0 });
    const entry = map.get(period);
    entry.sum += Number(e.percentage);
    entry.total += 1;
  }
  return [...map.values()]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((e) => ({ period: e.period, avg_score: Number((e.sum / e.total).toFixed(2)), total: e.total }));
}

async function teamPerformance(dataScope = null) {
  const db = readDb();
  const rows = filtered({}, dataScope);
  const map = new Map();
  for (const e of rows) {
    const team = db.teams.find((t) => t.id === e.team_id);
    const name = team ? team.name : null;
    if (!map.has(name)) map.set(name, { team_name: name, sum: 0, total: 0 });
    const entry = map.get(name);
    entry.sum += Number(e.percentage);
    entry.total += 1;
  }
  return [...map.values()]
    .map((e) => ({ team_name: e.team_name, avg_score: Number((e.sum / e.total).toFixed(2)), total: e.total }))
    .sort((a, b) => b.avg_score - a.avg_score);
}

async function agentPerformance(dataScope = null, { top = 5, order = 'DESC' } = {}) {
  const db = readDb();
  const rows = filtered({}, dataScope);
  const map = new Map();
  for (const e of rows) {
    if (!map.has(e.agent_id)) {
      const agent = db.users.find((u) => u.id === e.agent_id);
      map.set(e.agent_id, {
        agent_id: e.agent_id,
        agent_name: agent ? agent.name : null,
        sum: 0,
        total: 0,
      });
    }
    const entry = map.get(e.agent_id);
    entry.sum += Number(e.percentage);
    entry.total += 1;
  }
  let list = [...map.values()].map((e) => ({
    agent_id: e.agent_id,
    agent_name: e.agent_name,
    avg_score: Number((e.sum / e.total).toFixed(2)),
    total: e.total,
  }));
  list.sort((a, b) => (order === 'ASC' ? a.avg_score - b.avg_score : b.avg_score - a.avg_score));
  return list.slice(0, Number(top) || 5);
}

module.exports = {
  findAll, count, findById, create, update, remove, setStatus, buildFilters,
  stats, monthlyTrend, teamPerformance, agentPerformance,
};
