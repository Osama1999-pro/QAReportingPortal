const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/', settingsController.get);

router.put('/', allowRoles('super_admin'), [
  body('qa_pass_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('QA pass percentage must be between 0 and 100.'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be "light" or "dark".'),
], settingsController.update);

router.post('/logo', allowRoles('super_admin'), upload.single('logo'), settingsController.uploadLogo);

module.exports = router;
