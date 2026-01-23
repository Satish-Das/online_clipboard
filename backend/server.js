require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const clipboardRoutes = require('./routes/clipboard');
const Clipboard = require('./models/Clipboard');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/clipboard', clipboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipboard';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Socket.IO connection handling
const activeUsers = new Map(); // sessionId -> Set of socket IDs

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a clipboard session
  socket.on('join-session', async (sessionId) => {
    try {
      if (!sessionId || sessionId.length !== 6) {
        socket.emit('error', { message: 'Invalid session ID' });
        return;
      }

      const upperSessionId = sessionId.toUpperCase();
      
      // Check if session exists
      const clipboard = await Clipboard.findOne({ sessionId: upperSessionId });
      if (!clipboard) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Leave previous rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
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
      await Clipboard.findOneAndUpdate(
        { sessionId: upperSessionId },
        { activeUsers: userCount }
      );

      // Send current content to the joining user
      socket.emit('session-joined', {
        sessionId: upperSessionId,
        content: clipboard.content,
        activeUsers: userCount
      });

      // Notify other users in the session
      socket.to(upperSessionId).emit('user-joined', {
        activeUsers: userCount,
        message: 'A user joined the session'
      });

      console.log(`👤 User ${socket.id} joined session ${upperSessionId} (${userCount} active)`);

    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Handle content updates
  socket.on('content-update', async (data) => {
    try {
      const { sessionId, content } = data;
      
      if (!sessionId || !socket.currentSession || socket.currentSession !== sessionId) {
        socket.emit('error', { message: 'Not in a valid session' });
        return;
      }

      // Update content in database
      const clipboard = await Clipboard.findOneAndUpdate(
        { sessionId: sessionId.toUpperCase() },
        { content, lastActivity: new Date() },
        { new: true }
      );

      if (!clipboard) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Broadcast to all users in the session except sender
      socket.to(sessionId).emit('content-updated', {
        content,
        timestamp: new Date().toISOString(),
        updatedBy: socket.id
      });

    } catch (error) {
      console.error('Error updating content:', error);
      socket.emit('error', { message: 'Failed to update content' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (sessionId) => {
    if (socket.currentSession === sessionId) {
      socket.to(sessionId).emit('user-typing', { userId: socket.id, typing: true });
    }
  });

  socket.on('typing-stop', (sessionId) => {
    if (socket.currentSession === sessionId) {
      socket.to(sessionId).emit('user-typing', { userId: socket.id, typing: false });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    if (socket.currentSession) {
      const sessionId = socket.currentSession;
      
      // Remove user from active users
      if (activeUsers.has(sessionId)) {
        activeUsers.get(sessionId).delete(socket.id);
        const userCount = activeUsers.get(sessionId).size;
        
        // Clean up empty sessions
        if (userCount === 0) {
          activeUsers.delete(sessionId);
        }

        // Update database
        try {
          await Clipboard.findOneAndUpdate(
            { sessionId },
            { activeUsers: userCount }
          );

          // Notify remaining users
          socket.to(sessionId).emit('user-left', {
            activeUsers: userCount,
            message: 'A user left the session'
          });

          console.log(`👤 User ${socket.id} left session ${sessionId} (${userCount} remaining)`);
        } catch (error) {
          console.error('Error updating user count on disconnect:', error);
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});