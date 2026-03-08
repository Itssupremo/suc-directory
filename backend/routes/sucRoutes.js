const express = require('express');
const router = express.Router();
const {
  getAllSucs,
  getPublicSucs,
  getOccOfficials,
  createSuc,
  updateSuc,
  deleteSuc,
  transferSuc
} = require('../controllers/sucController');
const { authenticate, adminOnly, userSectionAccess } = require('../middleware/auth');

// Public routes
router.get('/public', getPublicSucs);
router.get('/occ-officials', getOccOfficials);

// Authenticated routes
router.get('/', authenticate, getAllSucs);
router.post('/', authenticate, userSectionAccess, createSuc);
router.put('/:id', authenticate, userSectionAccess, updateSuc);

// Admin-only routes
router.delete('/:id', authenticate, adminOnly, deleteSuc);
router.put('/:id/transfer', authenticate, adminOnly, transferSuc);

module.exports = router;
