const teamModel = require('../models/teamModel');
const auditModel = require('../models/auditModel');
const { handleValidation } = require('../middleware/errorHandler');

async function list(req, res, next) {
  try {
    const teams = await teamModel.findAll();
    res.json({ success: true, teams });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { name, department_id } = req.body;
    const team = await teamModel.create(name, department_id);
    await auditModel.log(req.user.id, 'team_created', name, req.ip);
    res.status(201).json({ success: true, message: 'Team created.', team });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { name, department_id } = req.body;
    const team = await teamModel.update(req.params.id, name, department_id);
    res.json({ success: true, message: 'Team updated.', team });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await teamModel.remove(req.params.id);
    res.json({ success: true, message: 'Team deleted.' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
