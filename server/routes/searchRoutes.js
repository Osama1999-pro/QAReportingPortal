const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);
router.get('/', searchController.search);

module.exports = router;
