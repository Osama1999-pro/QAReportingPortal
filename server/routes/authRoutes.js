const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');

router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], authController.login);

router.post('/forgot-password', loginLimiter, [
  body('email').isEmail().withMessage('A valid email is required.'),
], authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
], authController.resetPassword);

router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
