const app = require('../backend/server');
const { connectDB } = require('../backend/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  // Vercel rewrites /api/xxx to /api, but req.url still has the full path
  // Express needs to see the full /api/xxx path to match routes
  return app(req, res);
};
