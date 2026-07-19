const express = require('express');
const router = express.Router();

const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(authenticate, allowRoles('super_admin'));
router.get('/', auditController.list);

module.exports = router;
