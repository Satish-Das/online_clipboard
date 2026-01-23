require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const clipboardRoutes = require('./routes/clipboard.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const socketHandler = require('./sockets/clipboard.socket');
const Clipboard = require('./models/Clipboard.model');

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Routes
app.use('/api/clipboard', clipboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.IO handling
socketHandler(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start periodic cleanup of expired sessions
    startPeriodicCleanup();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Periodic cleanup of expired sessions
const startPeriodicCleanup = () => {
  // Run cleanup every 10 minutes
  const cleanupInterval = setInterval(async () => {
    try {
      const result = await Clipboard.cleanupExpiredSessions();
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
      }
    } catch (error) {
      console.error('Error during periodic cleanup:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Initial cleanup on startup
  setTimeout(async () => {
    try {
      const result = await Clipboard.cleanupExpiredSessions();
      if (result.deletedCount > 0) {
        console.log(`🧹 Initial cleanup: removed ${result.deletedCount} expired sessions`);
      }
    } catch (error) {
      console.error('Error during initial cleanup:', error);
    }
  }, 5000); // 5 seconds after startup

  // Clear interval on shutdown
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
  });

  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;