const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, createUser, deleteUser } = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.get('/', authenticate, adminOnly, getAllUsers);
router.post('/', authenticate, adminOnly, createUser);
router.put('/:id', authenticate, adminOnly, updateUser);
router.delete('/:id', authenticate, adminOnly, deleteUser);

module.exports = router;
