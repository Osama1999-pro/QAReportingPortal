const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const coachingController = require('../controllers/coachingController');
const { authenticate } = require('../middleware/auth');
const { allowRoles, scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);

router.get('/', coachingController.list);
router.get('/:id', coachingController.getOne);

const validators = [
  body('employee_id').isInt().withMessage('employee_id is required.'),
  body('coaching_date').isISO8601().withMessage('A valid coaching_date is required.'),
  body('reason').notEmpty().withMessage('Reason is required.'),
  body('action_plan').notEmpty().withMessage('Action plan is required.'),
];

router.post('/', allowRoles('super_admin', 'qa_evaluator', 'team_lead'), validators, coachingController.create);
router.put('/:id', allowRoles('super_admin', 'qa_evaluator', 'team_lead'), coachingController.update);
router.delete('/:id', allowRoles('super_admin', 'qa_evaluator'), coachingController.remove);

module.exports = router;
