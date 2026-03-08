const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ role: 1, fullname: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { fullname, username, password, role, occCode } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from changing own role
    if (req.user._id.toString() === req.params.id && role && role !== user.role) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Check username uniqueness if changed
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    if (fullname) user.fullname = fullname;
    if (password) user.password = password; // hashed by pre-save hook
    if (role) user.role = role;
    if (occCode !== undefined) user.occCode = occCode;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { fullname, username, password, role, occCode } = req.body;
    if (!fullname || !username || !password) {
      return res.status(400).json({ message: 'Fullname, username, and password are required' });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already taken' });

    const user = await User.create({ fullname, username, password, role: role || 'user', occCode: occCode || '' });
    const result = user.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
