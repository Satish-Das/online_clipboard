const Clipboard = require('../models/Clipboard.model');
const { validateSessionId } = require('../utils/validation');

// Track active users per session
const activeUsers = new Map(); // sessionId -> Set of socket IDs

/**
 * Handle Socket.IO connections for clipboard functionality
 * @param {object} io - Socket.IO server instance
 */
const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    /**
     * Handle user joining a clipboard session
     */
    socket.on('join-session', async (sessionId) => {
      try {
        // Validate session ID format
        const validation = validateSessionId(sessionId);
        if (!validation.isValid) {
          socket.emit('error', { 
            type: 'VALIDATION_ERROR',
            message: validation.message 
          });
          return;
        }

        const upperSessionId = sessionId.toUpperCase();
        
        // Check if session exists in database
        const clipboard = await Clipboard.findBySessionId(upperSessionId);
        if (!clipboard) {
          socket.emit('error', { 
            type: 'SESSION_NOT_FOUND',
            message: 'Session not found or expired' 
          });
          return;
        }

        // Leave previous rooms
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
            // Remove from previous session tracking
            if (activeUsers.has(room)) {
              activeUsers.get(room).delete(socket.id);
              if (activeUsers.get(room).size === 0) {
                activeUsers.delete(room);
              }
            }
          }
        });

        // Join new session room
        socket.join(upperSessionId);
        socket.currentSession = upperSessionId;

        // Track active users
        if (!activeUsers.has(upperSessionId)) {
          activeUsers.set(upperSessionId, new Set());
        }
        activeUsers.get(upperSessionId).add(socket.id);

        // Update active user count in database
        const userCount = activeUsers.get(upperSessionId).size;
        clipboard.activeUsers = userCount;
        await clipboard.save();

        // Send current content to the joining user
        socket.emit('session-joined', {
          sessionId: upperSessionId,
          content: clipboard.content,
          activeUsers: userCount,
          lastActivity: clipboard.lastActivity,
          metadata: clipboard.metadata
        });

        // Notify other users in the session
        socket.to(upperSessionId).emit('user-joined', {
          activeUsers: userCount,
          userId: socket.id,
          message: 'A user joined the session'
        });

        console.log(`👤 User ${socket.id} joined session ${upperSessionId} (${userCount} active)`);

      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { 
          type: 'SERVER_ERROR',
          message: 'Failed to join session' 
        });
      }
    });

    /**
     * Handle content updates from clients
     */
    socket.on('content-update', async (data) => {
      try {
        const { sessionId, content } = data;
        
        // Validate user is in the session
        if (!sessionId || !socket.currentSession || socket.currentSession !== sessionId.toUpperCase()) {
          socket.emit('error', { 
            type: 'UNAUTHORIZED',
            message: 'Not authorized to update this session' 
          });
          return;
        }

        // Validate content
        if (typeof content !== 'string') {
          socket.emit('error', { 
            type: 'VALIDATION_ERROR',
            message: 'Content must be a string' 
          });
          return;
        }

        if (content.length > 50000) {
          socket.emit('error', { 
            type: 'VALIDATION_ERROR',
            message: 'Content exceeds maximum length' 
          });
          return;
        }

        // Update content in database
        const clipboard = await Clipboard.findBySessionId(sessionId.toUpperCase());
        if (!clipboard) {
          socket.emit('error', { 
            type: 'SESSION_NOT_FOUND',
            message: 'Session not found or expired' 
          });
          return;
        }

        await clipboard.updateContent(content, socket.id);

        // Broadcast to all users in the session except sender
        socket.to(sessionId.toUpperCase()).emit('content-updated', {
          content,
          timestamp: new Date().toISOString(),
          updatedBy: socket.id,
          metadata: clipboard.metadata
        });

        // Confirm update to sender
        socket.emit('content-update-confirmed', {
          timestamp: new Date().toISOString(),
          metadata: clipboard.metadata
        });

      } catch (error) {
        console.error('Error updating content:', error);
        socket.emit('error', { 
          type: 'SERVER_ERROR',
          message: 'Failed to update content' 
        });
      }
    });

    /**
     * Handle typing indicators
     */
    socket.on('typing-start', (sessionId) => {
      if (socket.currentSession === sessionId?.toUpperCase()) {
        socket.to(sessionId.toUpperCase()).emit('user-typing', { 
          userId: socket.id, 
          typing: true 
        });
      }
    });

    socket.on('typing-stop', (sessionId) => {
      if (socket.currentSession === sessionId?.toUpperCase()) {
        socket.to(sessionId.toUpperCase()).emit('user-typing', { 
          userId: socket.id, 
          typing: false 
        });
      }
    });

    /**
     * Handle cursor position sharing (optional feature)
     */
    socket.on('cursor-position', (data) => {
      const { sessionId, position } = data;
      if (socket.currentSession === sessionId?.toUpperCase()) {
        socket.to(sessionId.toUpperCase()).emit('user-cursor', {
          userId: socket.id,
          position
        });
      }
    });

    /**
     * Handle user disconnection
     */
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      
      if (socket.currentSession) {
        const sessionId = socket.currentSession;
        
        try {
          // Remove user from active users tracking
          if (activeUsers.has(sessionId)) {
            activeUsers.get(sessionId).delete(socket.id);
            const userCount = activeUsers.get(sessionId).size;
            
            // Clean up empty sessions from memory
            if (userCount === 0) {
              activeUsers.delete(sessionId);
            }

            // Update database
            const clipboard = await Clipboard.findBySessionId(sessionId);
            if (clipboard) {
              clipboard.activeUsers = userCount;
              await clipboard.save();
            }

            // Notify remaining users
            socket.to(sessionId).emit('user-left', {
              activeUsers: userCount,
              userId: socket.id,
              message: 'A user left the session'
            });

            console.log(`👤 User ${socket.id} left session ${sessionId} (${userCount} remaining)`);
          }
        } catch (error) {
          console.error('Error handling user disconnect:', error);
        }
      }
    });

    /**
     * Handle manual session leave
     */
    socket.on('leave-session', async () => {
      if (socket.currentSession) {
        const sessionId = socket.currentSession;
        
        try {
          // Remove from room
          socket.leave(sessionId);
          
          // Update tracking
          if (activeUsers.has(sessionId)) {
            activeUsers.get(sessionId).delete(socket.id);
            const userCount = activeUsers.get(sessionId).size;
            
            if (userCount === 0) {
              activeUsers.delete(sessionId);
            }

            // Update database
            const clipboard = await Clipboard.findBySessionId(sessionId);
            if (clipboard) {
              clipboard.activeUsers = userCount;
              await clipboard.save();
            }

            // Notify remaining users
            socket.to(sessionId).emit('user-left', {
              activeUsers: userCount,
              userId: socket.id,
              message: 'A user left the session'
            });
          }

          socket.currentSession = null;
          socket.emit('session-left', { message: 'Successfully left session' });
          
        } catch (error) {
          console.error('Error leaving session:', error);
          socket.emit('error', { 
            type: 'SERVER_ERROR',
            message: 'Failed to leave session' 
          });
        }
      }
    });

    /**
     * Handle ping/pong for connection health
     */
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  // Cleanup inactive sessions periodically
  setInterval(async () => {
    try {
      const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      // Find sessions with no recent activity and no active users
      const inactiveSessions = await Clipboard.find({
        lastActivity: { $lt: cutoffTime },
        activeUsers: 0
      });

      if (inactiveSessions.length > 0) {
        const sessionIds = inactiveSessions.map(s => s.sessionId);
        await Clipboard.deleteMany({ sessionId: { $in: sessionIds } });
        console.log(`🧹 Cleaned up ${sessionIds.length} inactive sessions`);
      }
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }, 15 * 60 * 1000); // Run every 15 minutes
};

module.exports = handleSocketConnection;