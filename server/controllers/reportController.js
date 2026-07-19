// ==========================================================
// Reports controller.
// Applies the same filter set as evaluations, then groups results
// into the requested reporting period.
// ==========================================================
const evaluationModel = require('../models/evaluationModel');

function periodKey(dateStr, period) {
  const d = new Date(dateStr);
  switch (period) {
    case 'daily':
      return d.toISOString().slice(0, 10);
    case 'weekly': {
      const firstJan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((((d - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'quarterly':
      return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case 'yearly':
    default:
      return `${d.getFullYear()}`;
  }
}

async function generate(req, res, next) {
  try {
    const { period = 'monthly', agentId, evaluatorId, teamId, departmentId, channel, dateFrom, dateTo } = req.query;
    const filters = { agentId, evaluatorId, teamId, departmentId, channel, dateFrom, dateTo };

    const evaluations = await evaluationModel.findAll(filters, req.dataScope);

    const buckets = {};
    for (const e of evaluations) {
      const key = periodKey(e.evaluation_date, period);
      if (!buckets[key]) buckets[key] = { period: key, count: 0, totalPercentage: 0, passed: 0, failed: 0 };
      buckets[key].count += 1;
      buckets[key].totalPercentage += Number(e.percentage);
      buckets[key][e.pass_fail === 'Pass' ? 'passed' : 'failed'] += 1;
    }

    const rows = Object.values(buckets)
      .map((b) => ({
        period: b.period,
        evaluations: b.count,
        averageScore: Number((b.totalPercentage / b.count).toFixed(2)),
        passed: b.passed,
        failed: b.failed,
        passRate: Number(((b.passed / b.count) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json({ success: true, period, rows, rawCount: evaluations.length });
  } catch (err) { next(err); }
}

module.exports = { generate };
