const db = require('../db/connection');

/**
 * Enforce branch scoping on requests.
 * Allows access if:
 * 1. User has Super Administrator role or branch_scope === 'All'
 * 2. Target branch matches user's branch_scope
 */
function checkBranchScope(user, branchNameOrId) {
  if (!user) return false;
  if (user.role_name === 'Super Administrator' || user.role_id === 'role_superadmin') return true;
  if (!user.branch_scope || user.branch_scope === 'All') return true;

  if (!branchNameOrId) return true; // General nationwide view if permitted

  // Normalize comparisons
  const userScope = user.branch_scope.trim().toLowerCase();
  const target = String(branchNameOrId).trim().toLowerCase();

  return userScope === target;
}

function enforceBranchScope(paramName = 'branch') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (req.user.role_name === 'Super Administrator' || req.user.branch_scope === 'All') {
      return next();
    }

    const branch = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (branch && !checkBranchScope(req.user, branch)) {
      return res.status(403).json({
        success: false,
        error: `Cross-Branch Access Denied: Your account is restricted to branch '${req.user.branch_scope}'. You cannot access records for '${branch}'.`
      });
    }

    next();
  };
}

module.exports = {
  checkBranchScope,
  enforceBranchScope
};
