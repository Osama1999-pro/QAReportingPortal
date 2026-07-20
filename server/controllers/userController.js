// ==========================================================
// User / Employee management controller.
// Covers "Manage users" (Super Admin) and "Employee Management" —
// both operate on the same `users` table; role determines which
// screen an account shows up on in the UI.
// ==========================================================
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const auditModel = require('../models/auditModel');
const config = require('../config/config');
const { handleValidation } = require('../middleware/errorHandler');

async function list(req, res, next) {
  try {
    const { role, teamId, departmentId, status, search } = req.query;
    const users = await userModel.findAll({ role, teamId, departmentId, status, search });
    res.json({ success: true, count: users.length, users });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { employee_code, name, email, password, role, department_id, team_id, designation, manager_id, phone } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists.' });

    const password_hash = await bcrypt.hash(password || 'Welcome123!', config.bcrypt.saltRounds);
    const user = await userModel.create({ employee_code, name, email, password_hash, role, department_id, team_id, designation, manager_id, phone });

    await auditModel.log(req.user.id, 'user_created', `Created user ${email} (${role})`, req.ip);
    res.status(201).json({ success: true, message: 'User created.', user });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const user = await userModel.update(req.params.id, req.body);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await auditModel.log(req.user.id, 'user_updated', `Updated user #${req.params.id}`, req.ip);
    res.json({ success: true, message: 'User updated.', user });
  } catch (err) { next(err); }
}

async function setStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(422).json({ success: false, message: 'Status must be "active" or "inactive".' });
    }
    const user = await userModel.update(req.params.id, { status });
    await auditModel.log(req.user.id, 'user_status_changed', `User #${req.params.id} set to ${status}`, req.ip);
    res.json({ success: true, message: `User ${status === 'active' ? 'activated' : 'deactivated'}.`, user });
  } catch (err) { next(err); }
}

async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(422).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    const hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await userModel.updatePassword(req.params.id, hash);
    await auditModel.log(req.user.id, 'user_password_reset_by_admin', `User #${req.params.id}`, req.ip);
    res.json({ success: true, message: 'Password reset by administrator.' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await userModel.remove(req.params.id);
    await auditModel.log(req.user.id, 'user_deleted', `Deleted user #${req.params.id}`, req.ip);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const avatarPath = `/uploads/${req.file.filename}`;
    await userModel.setAvatar(req.params.id, avatarPath);
    res.json({ success: true, message: 'Avatar uploaded.', avatarPath });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, setStatus, resetUserPassword, remove, uploadAvatar };
