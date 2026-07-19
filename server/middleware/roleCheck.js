// ==========================================================
// Role-based access control.
// Usage: router.get('/path', authenticate, allowRoles('super_admin','qa_evaluator'), handler)
// ==========================================================

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

/**
 * Restricts an agent to only their own records, and a team lead to only
 * their team's records. super_admin and qa_evaluator are unrestricted.
 * Expects req.params.agentId OR falls back to req.user.id for "self" routes.
 */
function scopeToOwnData(req, res, next) {
  const { role, id, teamId } = req.user;
  if (role === 'super_admin' || role === 'qa_evaluator') return next();

  if (role === 'agent') {
    req.dataScope = { type: 'agent', agentId: id };
    return next();
  }
  if (role === 'team_lead') {
    req.dataScope = { type: 'team', teamId };
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied.' });
}

module.exports = { allowRoles, scopeToOwnData };
