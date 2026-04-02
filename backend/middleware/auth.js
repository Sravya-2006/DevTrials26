const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.worker = jwt.verify(token, process.env.JWT_SECRET || 'shieldshift_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
