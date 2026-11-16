// middleware/role.js – Role-based access control
// Usage: router.get('/admin-only', protect, role(['admin']), handler)
const role = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = role;
