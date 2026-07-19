const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(authenticate);

router.get('/', teamController.list);
router.post('/', allowRoles('super_admin'), [body('name').notEmpty(), body('department_id').isInt()], teamController.create);
router.put('/:id', allowRoles('super_admin'), [body('name').notEmpty(), body('department_id').isInt()], teamController.update);
router.delete('/:id', allowRoles('super_admin'), teamController.remove);

module.exports = router;
