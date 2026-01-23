const mongoose = require('mongoose');

const clipboardSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  content: {
    type: String,
    default: '',
    maxLength: 50000 // 50KB limit
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Update lastActivity on save
clipboardSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Index for faster queries
clipboardSchema.index({ sessionId: 1 });
clipboardSchema.index({ lastActivity: 1 });

module.exports = mongoose.model('Clipboard', clipboardSchema);