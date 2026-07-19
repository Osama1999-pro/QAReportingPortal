const departmentModel = require('../models/departmentModel');
const auditModel = require('../models/auditModel');
const { handleValidation } = require('../middleware/errorHandler');

async function list(req, res, next) {
  try {
    const departments = await departmentModel.findAll();
    res.json({ success: true, departments });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const department = await departmentModel.create(req.body.name);
    await auditModel.log(req.user.id, 'department_created', department.name, req.ip);
    res.status(201).json({ success: true, message: 'Department created.', department });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const department = await departmentModel.update(req.params.id, req.body.name);
    res.json({ success: true, message: 'Department updated.', department });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await departmentModel.remove(req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
