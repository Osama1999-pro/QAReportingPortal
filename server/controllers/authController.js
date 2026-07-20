// ==========================================================
// Auth controller — login, forgot/reset password, current user.
// Registration of new users is handled by userController (admin-only),
// there is no public self-signup for this internal portal.
// ==========================================================
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const auditModel = require('../models/auditModel');
const config = require('../config/config');
const { handleValidation } = require('../middleware/errorHandler');
const { signAuthToken, signResetToken, verifyResetToken } = require('../utils/tokenUtils');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

async function login(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { email, password, rememberMe } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    await userModel.touchLastLogin(user.id);
    await auditModel.log(user.id, 'login', `${user.email} logged in`, req.ip);

    const token = signAuthToken(user, !!rememberMe);
    const { password_hash, reset_token, reset_token_expires, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      expiresIn: rememberMe ? config.jwt.rememberMeExpiresIn : config.jwt.expiresIn,
      user: safeUser,
    });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { email } = req.body;
    const user = await userModel.findByEmail(email);

    // Always respond success to avoid leaking which emails are registered.
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = signResetToken(user);
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await userModel.setResetToken(user.id, token, expires);
    await sendPasswordResetEmail(user, token);
    await auditModel.log(user.id, 'password_reset_requested', '', req.ip);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { token, newPassword } = req.body;

    let payload;
    try {
      payload = verifyResetToken(token);
    } catch {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const user = await userModel.findRawById(payload.id);
    if (!user || user.reset_token !== token) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }
    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset link has expired.' });
    }

    const hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await userModel.updatePassword(user.id, hash);
    await userModel.clearResetToken(user.id);
    await auditModel.log(user.id, 'password_reset_completed', '', req.ip);

    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (err) { next(err); }
}

/** Stateless JWT: logout is a client-side token discard. Endpoint exists for audit logging & symmetry. */
async function logout(req, res, next) {
  try {
    if (req.user) await auditModel.log(req.user.id, 'logout', '', req.ip);
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) { next(err); }
}

module.exports = { login, me, forgotPassword, resetPassword, logout };
