// ==========================================================
// Export controller — CSV / Excel / PDF of the current evaluation filter set.
// ==========================================================
const evaluationModel = require('../models/evaluationModel');
const { rowsToCsv } = require('../utils/generateCsv');
const { rowsToExcelBuffer } = require('../utils/generateExcel');
const { buildTablePdf } = require('../utils/generatePdf');

const EXPORT_COLUMNS = [
  'Evaluation Code', 'Ticket #', 'Order #', 'Channel', 'Agent', 'Evaluator',
  'Team', 'Date', 'Score %', 'Result', 'Status',
];

function toExportRows(evaluations) {
  return evaluations.map((e) => ({
    'Evaluation Code': e.evaluation_code,
    'Ticket #': e.ticket_number || '',
    'Order #': e.order_number || '',
    'Channel': e.channel,
    'Agent': e.agent_name,
    'Evaluator': e.evaluator_name,
    'Team': e.team_name || '',
    'Date': e.evaluation_date,
    'Score %': e.percentage,
    'Result': e.pass_fail,
    'Status': e.status,
  }));
}

async function getFilteredEvaluations(req) {
  const { agentId, evaluatorId, teamId, departmentId, channel, status, passFail, dateFrom, dateTo, search } = req.query;
  const filters = { agentId, evaluatorId, teamId, departmentId, channel, status, passFail, dateFrom, dateTo, search };
  return evaluationModel.findAll(filters, req.dataScope);
}

async function exportCsv(req, res, next) {
  try {
    const evaluations = await getFilteredEvaluations(req);
    const csv = rowsToCsv(toExportRows(evaluations));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="qa-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

async function exportExcel(req, res, next) {
  try {
    const evaluations = await getFilteredEvaluations(req);
    const buffer = rowsToExcelBuffer(toExportRows(evaluations), 'QA Evaluations');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="qa-report-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

async function exportPdf(req, res, next) {
  try {
    const evaluations = await getFilteredEvaluations(req);
    const rows = evaluations.map((e) => [
      e.evaluation_code, e.ticket_number || '-', e.order_number || '-', e.channel, e.agent_name,
      e.evaluator_name, e.team_name || '-', e.evaluation_date, String(e.percentage), e.pass_fail, e.status,
    ]);
    const buffer = await buildTablePdf('QA Evaluation Report', EXPORT_COLUMNS, rows, `Generated ${new Date().toLocaleString()} · ${evaluations.length} records`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="qa-report-${Date.now()}.pdf"`);
    res.send(buffer);
  } catch (err) { next(err); }
}

module.exports = { exportCsv, exportExcel, exportPdf };
