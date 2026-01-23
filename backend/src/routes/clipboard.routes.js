const express = require('express');
const {
  createSession,
  getClipboard,
  updateClipboard,
  getSessionStats,
  getSessionTime,
  extendSession,
  deleteSession,
  cleanupExpiredSessions
} = require('../controllers/clipboard.controller');

const router = express.Router();

/**
 * @route   POST /api/clipboard/create
 * @desc    Create new clipboard session
 * @access  Public
 */
router.post('/create', createSession);

/**
 * @route   POST /api/clipboard/cleanup
 * @desc    Cleanup expired sessions
 * @access  Public
 */
router.post('/cleanup', cleanupExpiredSessions);

/**
 * @route   GET /api/clipboard/:sessionId
 * @desc    Get clipboard content by session ID
 * @access  Public
 */
router.get('/:sessionId', getClipboard);

/**
 * @route   PUT /api/clipboard/:sessionId
 * @desc    Update clipboard content
 * @access  Public
 */
router.put('/:sessionId', updateClipboard);

/**
 * @route   GET /api/clipboard/:sessionId/stats
 * @desc    Get session statistics
 * @access  Public
 */
router.get('/:sessionId/stats', getSessionStats);

/**
 * @route   GET /api/clipboard/:sessionId/time
 * @desc    Get session time remaining
 * @access  Public
 */
router.get('/:sessionId/time', getSessionTime);

/**
 * @route   POST /api/clipboard/:sessionId/extend
 * @desc    Extend session expiry
 * @access  Public
 */
router.post('/:sessionId/extend', extendSession);

/**
 * @route   DELETE /api/clipboard/:sessionId
 * @desc    Delete session (admin/cleanup)
 * @access  Public
 */
router.delete('/:sessionId', deleteSession);

module.exports = router;