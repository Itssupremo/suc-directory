const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// User section access — users can only modify Chairperson / Commissioner sections
const userSectionAccess = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const { section } = req.body;
  if (section && !['Chairperson', 'Commissioner'].includes(section)) {
    return res.status(403).json({ message: 'You can only manage Chairperson or Commissioner sections' });
  }
  next();
};

module.exports = { authenticate, adminOnly, userSectionAccess };
