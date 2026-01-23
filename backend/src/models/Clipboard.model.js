const mongoose = require('mongoose');

const clipboardSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    uppercase: true
  },
  content: {
    type: String,
    default: '',
    maxLength: 50000 // 50KB limit
  },
  activeUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800 // Auto-delete after 30 minutes (1800 seconds)
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
  },
  metadata: {
    totalEdits: {
      type: Number,
      default: 0
    },
    lastEditedBy: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
clipboardSchema.index({ sessionId: 1 });
clipboardSchema.index({ lastActivity: 1 });
clipboardSchema.index({ expiresAt: 1 });

// Update lastActivity and extend expiry on save
clipboardSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('activeUsers')) {
    this.lastActivity = new Date();
    // Extend expiry by 30 minutes on activity
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    if (this.isModified('content')) {
      this.metadata.totalEdits += 1;
    }
  }
  next();
});

// Static methods
clipboardSchema.statics.findBySessionId = function(sessionId) {
  const now = new Date();
  return this.findOne({ 
    sessionId: sessionId.toUpperCase(),
    expiresAt: { $gt: now } // Only return non-expired sessions
  });
};

clipboardSchema.statics.createSession = function(sessionId) {
  const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return this.create({
    sessionId: sessionId.toUpperCase(),
    content: '',
    activeUsers: 0,
    expiresAt: expiryTime
  });
};

clipboardSchema.statics.cleanupExpiredSessions = function() {
  const now = new Date();
  return this.deleteMany({ expiresAt: { $lt: now } });
};

clipboardSchema.statics.getSessionTimeRemaining = function(sessionId) {
  return this.findBySessionId(sessionId).then(session => {
    if (!session) return null;
    const now = new Date();
    const timeRemaining = session.expiresAt - now;
    return Math.max(0, Math.floor(timeRemaining / 1000)); // Return seconds remaining
  });
};

// Instance methods
clipboardSchema.methods.updateContent = function(content, userId = null) {
  this.content = content;
  this.lastActivity = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Extend expiry
  this.metadata.totalEdits += 1;
  if (userId) {
    this.metadata.lastEditedBy = userId;
  }
  return this.save();
};

clipboardSchema.methods.incrementUsers = function() {
  this.activeUsers += 1;
  this.lastActivity = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Extend expiry
  return this.save();
};

clipboardSchema.methods.decrementUsers = function() {
  this.activeUsers = Math.max(0, this.activeUsers - 1);
  this.lastActivity = new Date();
  // Don't extend expiry when users leave
  return this.save();
};

clipboardSchema.methods.extendExpiry = function() {
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  this.lastActivity = new Date();
  return this.save();
};

clipboardSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const timeRemaining = this.expiresAt - now;
  return Math.max(0, Math.floor(timeRemaining / 1000)); // Return seconds remaining
};

clipboardSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('Clipboard', clipboardSchema);