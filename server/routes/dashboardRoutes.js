const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);
router.get('/summary', dashboardController.summary);

module.exports = router;
