const settingsModel = require('../models/settingsModel');
const auditModel = require('../models/auditModel');
const { handleValidation } = require('../middleware/errorHandler');

async function get(req, res, next) {
  try {
    const settings = await settingsModel.get();
    res.json({ success: true, settings });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { company_name, qa_pass_percentage, theme } = req.body;
    const settings = await settingsModel.update({ company_name, qa_pass_percentage, theme });
    await auditModel.log(req.user.id, 'settings_updated', JSON.stringify(req.body), req.ip);
    res.json({ success: true, message: 'Settings updated.', settings });
  } catch (err) { next(err); }
}

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const logoPath = `/uploads/${req.file.filename}`;
    const settings = await settingsModel.update({ logo_path: logoPath });
    await auditModel.log(req.user.id, 'logo_updated', logoPath, req.ip);
    res.json({ success: true, message: 'Logo uploaded.', settings });
  } catch (err) { next(err); }
}

module.exports = { get, update, uploadLogo };
