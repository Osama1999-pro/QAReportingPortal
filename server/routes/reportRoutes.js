const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);
router.get('/', reportController.generate);

module.exports = router;
