const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

router.use(authenticate);

// Team leads / QA evaluators can view users (e.g. to pick an agent on the eval form);
// only super_admin can create, edit, deactivate, or delete.
router.get('/', allowRoles('super_admin', 'qa_evaluator', 'team_lead'), userController.list);
router.get('/:id', allowRoles('super_admin', 'qa_evaluator', 'team_lead'), userController.getOne);

const userValidators = [
  body('name').notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('role').isIn(['super_admin', 'qa_evaluator', 'team_lead', 'agent']).withMessage('Invalid role.'),
];

router.post('/', allowRoles('super_admin'), userValidators, userController.create);
router.put('/:id', allowRoles('super_admin'), userController.update);
router.patch('/:id/status', allowRoles('super_admin'), userController.setStatus);
router.post('/:id/reset-password', allowRoles('super_admin'), userController.resetUserPassword);
router.post('/:id/avatar', allowRoles('super_admin'), upload.single('avatar'), userController.uploadAvatar);
router.delete('/:id', allowRoles('super_admin'), userController.remove);

module.exports = router;
