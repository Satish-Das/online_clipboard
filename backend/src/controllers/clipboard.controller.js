const Clipboard = require('../models/Clipboard.model');
const { generateSessionId } = require('../utils/helpers');
const { validateSessionId, validateContent } = require('../utils/validation');

/**
 * Create new clipboard session
 * @route POST /api/clipboard/create
 */
const createSession = async (req, res) => {
  try {
    let sessionId;
    let existingSession;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Generate unique session ID with retry logic
    do {
      sessionId = generateSessionId();
      existingSession = await Clipboard.findBySessionId(sessionId);
      attempts++;
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate unique session ID. Please try again.'
        });
      }
    } while (existingSession);

    const clipboard = await Clipboard.createSession(sessionId);
    
    res.status(201).json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        createdAt: clipboard.createdAt,
        expiresAt: clipboard.expiresAt,
        timeRemaining: clipboard.getTimeRemaining()
      },
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get clipboard content by session ID
 * @route GET /api/clipboard/:sessionId
 */
const getClipboard = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate session ID format
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const clipboard = await Clipboard.findBySessionId(sessionId);

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
        expired: true
      });
    }

    // Check if session is expired
    if (clipboard.isExpired()) {
      // Clean up expired session
      await clipboard.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Session has expired',
        expired: true
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        content: clipboard.content,
        activeUsers: clipboard.activeUsers,
        lastActivity: clipboard.lastActivity,
        expiresAt: clipboard.expiresAt,
        timeRemaining: clipboard.getTimeRemaining(),
        metadata: clipboard.metadata
      }
    });
  } catch (error) {
    console.error('Error fetching clipboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clipboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update clipboard content
 * @route PUT /api/clipboard/:sessionId
 */
const updateClipboard = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    // Validate session ID
    const sessionValidation = validateSessionId(sessionId);
    if (!sessionValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: sessionValidation.message
      });
    }

    // Validate content
    const contentValidation = validateContent(content);
    if (!contentValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: contentValidation.message
      });
    }

    const clipboard = await Clipboard.findBySessionId(sessionId);

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
        expired: true
      });
    }

    // Check if session is expired
    if (clipboard.isExpired()) {
      await clipboard.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Session has expired',
        expired: true
      });
    }

    await clipboard.updateContent(content, req.ip);

    res.json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        content: clipboard.content,
        lastActivity: clipboard.lastActivity,
        expiresAt: clipboard.expiresAt,
        timeRemaining: clipboard.getTimeRemaining(),
        metadata: clipboard.metadata
      },
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating clipboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clipboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get session statistics and time remaining
 * @route GET /api/clipboard/:sessionId/stats
 */
const getSessionStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const clipboard = await Clipboard.findBySessionId(sessionId);

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
        expired: true
      });
    }

    // Check if session is expired
    if (clipboard.isExpired()) {
      await clipboard.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Session has expired',
        expired: true
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        stats: {
          activeUsers: clipboard.activeUsers,
          contentLength: clipboard.content.length,
          wordCount: clipboard.content.trim() ? clipboard.content.trim().split(/\s+/).length : 0,
          lineCount: clipboard.content.split('\n').length,
          lastActivity: clipboard.lastActivity,
          createdAt: clipboard.createdAt,
          expiresAt: clipboard.expiresAt,
          timeRemaining: clipboard.getTimeRemaining(),
          totalEdits: clipboard.metadata.totalEdits,
          lastEditedBy: clipboard.metadata.lastEditedBy
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check session time remaining
 * @route GET /api/clipboard/:sessionId/time
 */
const getSessionTime = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const clipboard = await Clipboard.findBySessionId(sessionId);

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
        expired: true,
        timeRemaining: 0
      });
    }

    // Check if session is expired
    if (clipboard.isExpired()) {
      await clipboard.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Session has expired',
        expired: true,
        timeRemaining: 0
      });
    }

    const timeRemaining = clipboard.getTimeRemaining();

    res.json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        timeRemaining,
        expiresAt: clipboard.expiresAt,
        expired: false
      }
    });
  } catch (error) {
    console.error('Error fetching session time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session time',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Extend session expiry
 * @route POST /api/clipboard/:sessionId/extend
 */
const extendSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const clipboard = await Clipboard.findBySessionId(sessionId);

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
        expired: true
      });
    }

    // Check if session is expired
    if (clipboard.isExpired()) {
      await clipboard.deleteOne();
      return res.status(410).json({
        success: false,
        message: 'Session has expired',
        expired: true
      });
    }

    await clipboard.extendExpiry();

    res.json({
      success: true,
      data: {
        sessionId: clipboard.sessionId,
        expiresAt: clipboard.expiresAt,
        timeRemaining: clipboard.getTimeRemaining()
      },
      message: 'Session extended successfully'
    });
  } catch (error) {
    console.error('Error extending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete session (admin/cleanup)
 * @route DELETE /api/clipboard/:sessionId
 */
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const validation = validateSessionId(sessionId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const result = await Clipboard.deleteOne({ sessionId: sessionId.toUpperCase() });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cleanup expired sessions (admin endpoint)
 * @route POST /api/clipboard/cleanup
 */
const cleanupExpiredSessions = async (req, res) => {
  try {
    const result = await Clipboard.cleanupExpiredSessions();
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Cleaned up ${result.deletedCount} expired sessions`
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createSession,
  getClipboard,
  updateClipboard,
  getSessionStats,
  getSessionTime,
  extendSession,
  deleteSession,
  cleanupExpiredSessions
};