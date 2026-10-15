function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Authentication required.'
      });
    }

    // Super Administrator bypasses all permission checks
    if (req.user.role_name === 'Super Administrator' || req.user.role_id === 'role_superadmin') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permissionName)) {
      const msg = `Access Denied: You do not have the required permission ('${permissionName}') to perform this action.`;
      return res.status(403).json({
        success: false,
        error: msg,
        message: msg
      });
    }

    next();
  };
}

function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        message: 'Authentication required.'
      });
    }

    if (req.user.role_name === 'Super Administrator' || req.user.role_id === 'role_superadmin') {
      return next();
    }

    if (!rolesArray.includes(req.user.role_name) && !rolesArray.includes(req.user.role_id)) {
      const msg = `Access Denied: Action restricted to roles: ${rolesArray.join(', ')}.`;
      return res.status(403).json({
        success: false,
        error: msg,
        message: msg
      });
    }

    next();
  };
}

module.exports = {
  requirePermission,
  requireRole
};
