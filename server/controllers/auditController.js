const auditModel = require('../models/auditModel');

async function list(req, res, next) {
  try {
    const logs = await auditModel.findAll(Number(req.query.limit) || 100);
    res.json({ success: true, logs });
  } catch (err) { next(err); }
}

module.exports = { list };
