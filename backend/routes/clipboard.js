const express = require('express');
const Clipboard = require('../models/Clipboard');
const router = express.Router();

// Generate random 6-digit session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create new clipboard session
router.post('/create', async (req, res) => {
  try {
    let sessionId;
    let existingSession;
    
    // Generate unique session ID
    do {
      sessionId = generateSessionId();
      existingSession = await Clipboard.findOne({ sessionId });
    } while (existingSession);

    const clipboard = new Clipboard({
      sessionId,
      content: '',
      activeUsers: 0
    });

    await clipboard.save();
    
    res.status(201).json({
      success: true,
      sessionId,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});

// Get clipboard content by session ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || sessionId.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    const clipboard = await Clipboard.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      content: clipboard.content,
      activeUsers: clipboard.activeUsers,
      lastActivity: clipboard.lastActivity
    });
  } catch (error) {
    console.error('Error fetching clipboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clipboard'
    });
  }
});

// Update clipboard content
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!sessionId || sessionId.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Content must be a string'
      });
    }

    const clipboard = await Clipboard.findOneAndUpdate(
      { sessionId: sessionId.toUpperCase() },
      { content, lastActivity: new Date() },
      { new: true, upsert: false }
    );

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      content: clipboard.content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating clipboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clipboard'
    });
  }
});

// Get session statistics
router.get('/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const clipboard = await Clipboard.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });

    if (!clipboard) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      stats: {
        activeUsers: clipboard.activeUsers,
        contentLength: clipboard.content.length,
        lastActivity: clipboard.lastActivity,
        createdAt: clipboard.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;