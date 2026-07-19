const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const evaluationController = require('../controllers/evaluationController');
const { authenticate } = require('../middleware/auth');
const { allowRoles, scopeToOwnData } = require('../middleware/roleCheck');

router.use(authenticate, scopeToOwnData);

router.get('/scorecard-template', evaluationController.scorecardTemplate);
router.get('/', evaluationController.list); // list is auto-scoped: agents see only their own, team leads only their team
router.get('/:id', evaluationController.getOne);

const evalValidators = [
  body('channel').isIn(['Email', 'Live Chat', 'Facebook', 'Instagram', 'WhatsApp', 'Voice']).withMessage('Invalid channel.'),
  body('agent_id').isInt().withMessage('agent_id is required.'),
  body('evaluation_date').isISO8601().withMessage('A valid evaluation_date is required.'),
];

// Only QA Evaluators and Super Admin create/edit/delete evaluations.
router.post('/', allowRoles('super_admin', 'qa_evaluator'), evalValidators, evaluationController.create);
router.put('/:id', allowRoles('super_admin', 'qa_evaluator'), evaluationController.update);
router.delete('/:id', allowRoles('super_admin', 'qa_evaluator'), evaluationController.remove);

// Workflow actions
router.post('/:id/dispute', allowRoles('super_admin', 'team_lead', 'agent'), evaluationController.dispute);
router.post('/:id/reopen', allowRoles('super_admin', 'qa_evaluator'), evaluationController.reopen);
router.post('/:id/complete', allowRoles('super_admin', 'qa_evaluator'), evaluationController.complete);

module.exports = router;
