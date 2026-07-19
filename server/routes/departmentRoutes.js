const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(authenticate);

router.get('/', departmentController.list);
router.post('/', allowRoles('super_admin'), [body('name').notEmpty()], departmentController.create);
router.put('/:id', allowRoles('super_admin'), [body('name').notEmpty()], departmentController.update);
router.delete('/:id', allowRoles('super_admin'), departmentController.remove);

module.exports = router;
