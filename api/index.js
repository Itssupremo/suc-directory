const app = require('../backend/server');
const { connectDB } = require('../backend/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  // Ensure Express sees the full original URL path
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
