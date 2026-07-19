const express = require('express');
const router = express.Router();

const exportController = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');
const { scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);

router.get('/csv', exportController.exportCsv);
router.get('/excel', exportController.exportExcel);
router.get('/pdf', exportController.exportPdf);

module.exports = router;
