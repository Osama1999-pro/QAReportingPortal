const coachingModel = require('../models/coachingModel');
const auditModel = require('../models/auditModel');
const { handleValidation } = require('../middleware/errorHandler');

async function list(req, res, next) {
  try {
    const { employeeId, coachId, status } = req.query;
    let scopedEmployeeId = employeeId;
    if (req.dataScope?.type === 'agent') scopedEmployeeId = req.dataScope.agentId;
    const sessions = await coachingModel.findAll({ employeeId: scopedEmployeeId, coachId, status });
    res.json({ success: true, sessions });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const session = await coachingModel.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Coaching session not found.' });
    res.json({ success: true, session });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const data = { ...req.body, coach_id: req.body.coach_id || req.user.id };
    const session = await coachingModel.create(data);
    await auditModel.log(req.user.id, 'coaching_created', `Employee #${data.employee_id}`, req.ip);
    res.status(201).json({ success: true, message: 'Coaching session logged.', session });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const session = await coachingModel.update(req.params.id, req.body);
    res.json({ success: true, message: 'Coaching session updated.', session });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await coachingModel.remove(req.params.id);
    res.json({ success: true, message: 'Coaching session deleted.' });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
