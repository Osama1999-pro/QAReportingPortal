// ==========================================================
// Evaluation model — evaluations + their scorecard line items.
// ==========================================================
const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT e.*, 
         a.name AS agent_name, a.employee_code AS agent_code,
         ev.name AS evaluator_name,
         tl.name AS team_lead_name,
         t.name AS team_name
  FROM evaluations e
  JOIN users a ON a.id = e.agent_id
  JOIN users ev ON ev.id = e.evaluator_id
  LEFT JOIN users tl ON tl.id = e.team_lead_id
  LEFT JOIN teams t ON t.id = e.team_id
`;

function generateEvalCode() {
  return `EVAL-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

/** Builds WHERE clause + params from a filter object shared by list/report/export endpoints. */
function buildFilters(filters = {}, dataScope = null) {
  const clauses = [];
  const params = [];

  if (filters.agentId) { clauses.push('e.agent_id = ?'); params.push(filters.agentId); }
  if (filters.evaluatorId) { clauses.push('e.evaluator_id = ?'); params.push(filters.evaluatorId); }
  if (filters.teamId) { clauses.push('e.team_id = ?'); params.push(filters.teamId); }
  if (filters.departmentId) { clauses.push('a.department_id = ?'); params.push(filters.departmentId); }
  if (filters.channel) { clauses.push('e.channel = ?'); params.push(filters.channel); }
  if (filters.status) { clauses.push('e.status = ?'); params.push(filters.status); }
  if (filters.passFail) { clauses.push('e.pass_fail = ?'); params.push(filters.passFail); }
  if (filters.dateFrom) { clauses.push('e.evaluation_date >= ?'); params.push(filters.dateFrom); }
  if (filters.dateTo) { clauses.push('e.evaluation_date <= ?'); params.push(filters.dateTo); }
  if (filters.search) {
    clauses.push('(e.ticket_number LIKE ? OR e.order_number LIKE ? OR a.name LIKE ? OR e.evaluation_code LIKE ?)');
    const s = `%${filters.search}%`;
    params.push(s, s, s, s);
  }

  if (dataScope) {
    if (dataScope.type === 'agent') { clauses.push('e.agent_id = ?'); params.push(dataScope.agentId); }
    if (dataScope.type === 'team') { clauses.push('e.team_id = ?'); params.push(dataScope.teamId); }
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function findAll(filters = {}, dataScope = null, { limit, offset } = {}) {
  const { where, params } = buildFilters(filters, dataScope);
  let sql = `${BASE_SELECT} ${where} ORDER BY e.evaluation_date DESC, e.id DESC`;
  if (limit) { sql += ' LIMIT ? OFFSET ?'; params.push(Number(limit), Number(offset) || 0); }
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function count(filters = {}, dataScope = null) {
  const { where, params } = buildFilters(filters, dataScope);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM evaluations e JOIN users a ON a.id = e.agent_id ${where}`, params);
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE e.id = ?`, [id]);
  if (!rows[0]) return null;
  const [items] = await pool.query('SELECT * FROM evaluation_scorecard_items WHERE evaluation_id = ?', [id]);
  return { ...rows[0], scorecard: items };
}

/**
 * @param {Object} data - evaluation header fields
 * @param {Array<{section_key,section_label,max_score,obtained_score,comments}>} scorecard
 * @param {Number} passPercentage
 */
async function create(data, scorecard, passPercentage) {
  const totalMax = scorecard.reduce((s, i) => s + Number(i.max_score), 0);
  const totalObtained = scorecard.reduce((s, i) => s + Number(i.obtained_score), 0);
  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const passFail = percentage >= passPercentage ? 'Pass' : 'Fail';
  const code = generateEvalCode();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO evaluations
        (evaluation_code, ticket_number, order_number, channel, agent_id, evaluator_id, team_lead_id, team_id,
         evaluation_date, total_max_score, total_obtained_score, percentage, pass_fail, status, overall_comments)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, data.ticket_number || null, data.order_number || null, data.channel, data.agent_id, data.evaluator_id,
       data.team_lead_id || null, data.team_id || null, data.evaluation_date, totalMax, totalObtained, percentage,
       passFail, data.status || 'completed', data.overall_comments || null]
    );
    const evalId = result.insertId;
    for (const item of scorecard) {
      await conn.query(
        `INSERT INTO evaluation_scorecard_items (evaluation_id, section_key, section_label, max_score, obtained_score, comments)
         VALUES (?,?,?,?,?,?)`,
        [evalId, item.section_key, item.section_label, item.max_score, item.obtained_score, item.comments || null]
      );
    }
    await conn.commit();
    return findById(evalId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function update(id, data, scorecard, passPercentage) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalMax, totalObtained, percentage, passFail;
    if (scorecard && scorecard.length) {
      totalMax = scorecard.reduce((s, i) => s + Number(i.max_score), 0);
      totalObtained = scorecard.reduce((s, i) => s + Number(i.obtained_score), 0);
      percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      passFail = percentage >= passPercentage ? 'Pass' : 'Fail';
      await conn.query('DELETE FROM evaluation_scorecard_items WHERE evaluation_id = ?', [id]);
      for (const item of scorecard) {
        await conn.query(
          `INSERT INTO evaluation_scorecard_items (evaluation_id, section_key, section_label, max_score, obtained_score, comments)
           VALUES (?,?,?,?,?,?)`,
          [id, item.section_key, item.section_label, item.max_score, item.obtained_score, item.comments || null]
        );
      }
    }

    const fields = ['ticket_number', 'order_number', 'channel', 'agent_id', 'evaluator_id', 'team_lead_id',
      'team_id', 'evaluation_date', 'status', 'overall_comments'];
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (data[f] !== undefined) { sets.push(`${f} = ?`); params.push(data[f]); }
    }
    if (totalMax !== undefined) {
      sets.push('total_max_score = ?', 'total_obtained_score = ?', 'percentage = ?', 'pass_fail = ?');
      params.push(totalMax, totalObtained, percentage, passFail);
    }
    if (sets.length) {
      params.push(id);
      await conn.query(`UPDATE evaluations SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function remove(id) {
  await pool.query('DELETE FROM evaluations WHERE id = ?', [id]);
}

async function setStatus(id, status) {
  await pool.query('UPDATE evaluations SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

/* ---------------- Aggregates for dashboard & reports ---------------- */

async function stats(dataScope = null) {
  const { where, params } = buildFilters({}, dataScope);
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total_evaluations,
            ROUND(AVG(e.percentage),2) AS avg_score,
            SUM(CASE WHEN e.pass_fail = 'Pass' THEN 1 ELSE 0 END) AS passed,
            SUM(CASE WHEN e.pass_fail = 'Fail' THEN 1 ELSE 0 END) AS failed,
            SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) AS pending
     FROM evaluations e JOIN users a ON a.id = e.agent_id ${where}`, params);
  return totals;
}

async function monthlyTrend(dataScope = null, months = 6) {
  const { where, params } = buildFilters({ dateFrom: monthsAgo(months) }, dataScope);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(e.evaluation_date, '%Y-%m') AS period, ROUND(AVG(e.percentage),2) AS avg_score, COUNT(*) AS total
     FROM evaluations e JOIN users a ON a.id = e.agent_id ${where}
     GROUP BY period ORDER BY period ASC`, params);
  return rows;
}

async function teamPerformance(dataScope = null) {
  const { where, params } = buildFilters({}, dataScope);
  const [rows] = await pool.query(
    `SELECT t.name AS team_name, ROUND(AVG(e.percentage),2) AS avg_score, COUNT(*) AS total
     FROM evaluations e JOIN users a ON a.id = e.agent_id LEFT JOIN teams t ON t.id = e.team_id
     ${where} GROUP BY t.name ORDER BY avg_score DESC`, params);
  return rows;
}

async function agentPerformance(dataScope = null, { top = 5, order = 'DESC' } = {}) {
  const { where, params } = buildFilters({}, dataScope);
  params.push(top);
  const [rows] = await pool.query(
    `SELECT a.id AS agent_id, a.name AS agent_name, ROUND(AVG(e.percentage),2) AS avg_score, COUNT(*) AS total
     FROM evaluations e JOIN users a ON a.id = e.agent_id ${where}
     GROUP BY a.id, a.name ORDER BY avg_score ${order === 'ASC' ? 'ASC' : 'DESC'} LIMIT ?`, params);
  return rows;
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  findAll, count, findById, create, update, remove, setStatus, buildFilters,
  stats, monthlyTrend, teamPerformance, agentPerformance,
};
