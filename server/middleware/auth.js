// ==========================================================
// JWT authentication middleware.
// Expects: Authorization: Bearer <token>
// Attaches req.user = { id, role, teamId, departmentId, name, email }
// ==========================================================
const jwt = require('jsonwebtoken');
const config = require('../config/config');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

module.exports = { authenticate };
