const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agri_marketplace_super_secret_jwt_key_2026_sih';

// Verify JWT token from Authorization: Bearer <token>
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Ensure user has admin privileges
function requireAdmin(req, res, next) {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
