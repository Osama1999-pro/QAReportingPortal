// ==========================================================
// JWT helper functions.
// ==========================================================
const jwt = require('jsonwebtoken');
const config = require('../config/config');

function signAuthToken(user, rememberMe = false) {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    teamId: user.team_id ?? null,
    departmentId: user.department_id ?? null,
  };
  const expiresIn = rememberMe ? config.jwt.rememberMeExpiresIn : config.jwt.expiresIn;
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

function signResetToken(user) {
  return jwt.sign({ id: user.id, purpose: 'password_reset' }, config.jwt.resetSecret, {
    expiresIn: config.jwt.resetExpiresIn,
  });
}

function verifyResetToken(token) {
  return jwt.verify(token, config.jwt.resetSecret);
}

module.exports = { signAuthToken, signResetToken, verifyResetToken };
