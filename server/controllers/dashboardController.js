const evaluationModel = require('../models/evaluationModel');

async function summary(req, res, next) {
  try {
    const [totals, trend, teamPerf, topAgents, bottomAgents] = await Promise.all([
      evaluationModel.stats(req.dataScope),
      evaluationModel.monthlyTrend(req.dataScope, 6),
      evaluationModel.teamPerformance(req.dataScope),
      evaluationModel.agentPerformance(req.dataScope, { top: 5, order: 'DESC' }),
      evaluationModel.agentPerformance(req.dataScope, { top: 5, order: 'ASC' }),
    ]);

    const passRate = totals.total_evaluations > 0
      ? Number(((totals.passed / totals.total_evaluations) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      summary: {
        totalEvaluations: Number(totals.total_evaluations) || 0,
        averageScore: Number(totals.avg_score) || 0,
        passed: Number(totals.passed) || 0,
        failed: Number(totals.failed) || 0,
        passRate,
        completed: Number(totals.completed) || 0,
        pending: Number(totals.pending) || 0,
        coachingRequired: Number(totals.failed) || 0,
      },
      monthlyTrend: trend,
      teamPerformance: teamPerf,
      topPerformers: topAgents,
      lowestPerformers: bottomAgents,
    });
  } catch (err) { next(err); }
}

module.exports = { summary };
