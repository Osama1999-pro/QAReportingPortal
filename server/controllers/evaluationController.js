// ==========================================================
// QA Evaluation controller.
// Handles the scorecard, auto total/percentage/pass-fail calculation,
// and the evaluation lifecycle (draft -> completed -> disputed -> reopened).
// ==========================================================
const evaluationModel = require('../models/evaluationModel');
const settingsModel = require('../models/settingsModel');
const auditModel = require('../models/auditModel');
const { handleValidation } = require('../middleware/errorHandler');
const config = require('../config/config');

/** Default scorecard template — the 11 sections required by the QA form. */
const SCORECARD_TEMPLATE = [
  { section_key: 'greeting', section_label: 'Greeting', max_score: 10 },
  { section_key: 'verification', section_label: 'Verification', max_score: 10 },
  { section_key: 'empathy', section_label: 'Empathy', max_score: 10 },
  { section_key: 'product_knowledge', section_label: 'Product Knowledge', max_score: 10 },
  { section_key: 'grammar', section_label: 'Grammar', max_score: 5 },
  { section_key: 'communication', section_label: 'Communication', max_score: 10 },
  { section_key: 'resolution', section_label: 'Resolution', max_score: 15 },
  { section_key: 'policy_compliance', section_label: 'Policy Compliance', max_score: 15 },
  { section_key: 'ownership', section_label: 'Ownership', max_score: 5 },
  { section_key: 'professionalism', section_label: 'Professionalism', max_score: 5 },
  { section_key: 'closing', section_label: 'Closing', max_score: 5 },
];

function scorecardTemplate(req, res) {
  res.json({ success: true, template: SCORECARD_TEMPLATE, channels: ['Email', 'Live Chat', 'Facebook', 'Instagram', 'WhatsApp', 'Voice'] });
}

async function getPassPercentage() {
  const settings = await settingsModel.get();
  return Number(settings?.qa_pass_percentage) || config.defaults.qaPassPercentage;
}

async function list(req, res, next) {
  try {
    const { agentId, evaluatorId, teamId, departmentId, channel, status, passFail, dateFrom, dateTo, search, page, pageSize } = req.query;
    const filters = { agentId, evaluatorId, teamId, departmentId, channel, status, passFail, dateFrom, dateTo, search };
    const limit = Number(pageSize) || 20;
    const offset = ((Number(page) || 1) - 1) * limit;

    const [evaluations, total] = await Promise.all([
      evaluationModel.findAll(filters, req.dataScope, { limit, offset }),
      evaluationModel.count(filters, req.dataScope),
    ]);

    res.json({ success: true, evaluations, pagination: { page: Number(page) || 1, pageSize: limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const evaluation = await evaluationModel.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found.' });

    if (req.dataScope?.type === 'agent' && evaluation.agent_id !== req.dataScope.agentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.dataScope?.type === 'team' && evaluation.team_id !== req.dataScope.teamId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, evaluation });
  } catch (err) { next(err); }
}

function validateScorecard(scorecard) {
  if (!Array.isArray(scorecard) || !scorecard.length) return 'Scorecard is required.';
  for (const item of scorecard) {
    if (!item.section_key || !item.section_label) return 'Each scorecard item needs a section_key and section_label.';
    if (item.obtained_score === undefined || item.max_score === undefined) return 'Each scorecard item needs max_score and obtained_score.';
    if (Number(item.obtained_score) > Number(item.max_score)) return `"${item.section_label}" obtained score cannot exceed its max score.`;
    if (Number(item.obtained_score) < 0) return `"${item.section_label}" obtained score cannot be negative.`;
  }
  return null;
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { scorecard, ...header } = req.body;

    const scorecardError = validateScorecard(scorecard);
    if (scorecardError) return res.status(422).json({ success: false, message: scorecardError });

    header.evaluator_id = header.evaluator_id || req.user.id;
    const passPercentage = await getPassPercentage();
    const evaluation = await evaluationModel.create(header, scorecard, passPercentage);

    await auditModel.log(req.user.id, 'evaluation_created', `${evaluation.evaluation_code} for agent #${header.agent_id}`, req.ip);
    res.status(201).json({ success: true, message: 'Evaluation submitted.', evaluation });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { scorecard, ...header } = req.body;

    if (scorecard) {
      const scorecardError = validateScorecard(scorecard);
      if (scorecardError) return res.status(422).json({ success: false, message: scorecardError });
    }

    const passPercentage = await getPassPercentage();
    const evaluation = await evaluationModel.update(req.params.id, header, scorecard, passPercentage);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found.' });

    await auditModel.log(req.user.id, 'evaluation_updated', `#${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Evaluation updated.', evaluation });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await evaluationModel.remove(req.params.id);
    await auditModel.log(req.user.id, 'evaluation_deleted', `#${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Evaluation deleted.' });
  } catch (err) { next(err); }
}

async function dispute(req, res, next) {
  try {
    const evaluation = await evaluationModel.setStatus(req.params.id, 'disputed');
    await auditModel.log(req.user.id, 'evaluation_disputed', `#${req.params.id}: ${req.body.reason || ''}`, req.ip);
    res.json({ success: true, message: 'Evaluation marked as disputed.', evaluation });
  } catch (err) { next(err); }
}

async function reopen(req, res, next) {
  try {
    const evaluation = await evaluationModel.setStatus(req.params.id, 'reopened');
    await auditModel.log(req.user.id, 'evaluation_reopened', `#${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Evaluation reopened for corrections.', evaluation });
  } catch (err) { next(err); }
}

async function complete(req, res, next) {
  try {
    const evaluation = await evaluationModel.setStatus(req.params.id, 'completed');
    await auditModel.log(req.user.id, 'evaluation_completed', `#${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Evaluation closed.', evaluation });
  } catch (err) { next(err); }
}

module.exports = { scorecardTemplate, list, getOne, create, update, remove, dispute, reopen, complete };
