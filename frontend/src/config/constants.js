// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  TIMEOUT: 10000, // 10 seconds
};

// Application Constants
export const APP_CONFIG = {
  SESSION_ID_LENGTH: 6,
  MAX_CONTENT_LENGTH: 50000, // 50KB
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  TYPING_TIMEOUT: 1000, // 1 second
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000, // 3 seconds
};

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  SUCCESS_TOAST_DURATION: 3000,
  ERROR_TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
};

// Socket Events
export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_SESSION: 'join-session',
  CONTENT_UPDATE: 'content-update',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  LEAVE_SESSION: 'leave-session',
  PING: 'ping',
  
  // Server to Client
  SESSION_JOINED: 'session-joined',
  CONTENT_UPDATED: 'content-updated',
  CONTENT_UPDATE_CONFIRMED: 'content-update-confirmed',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_TYPING: 'user-typing',
  SESSION_LEFT: 'session-left',
  ERROR: 'error',
  PONG: 'pong',
  
  // Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
};

// Error Types
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  RECENT_SESSIONS: 'clipboard_recent_sessions',
  USER_PREFERENCES: 'clipboard_user_preferences',
  DRAFT_CONTENT: 'clipboard_draft_content',
};

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: 1024 * 1024, // 1MB
  ALLOWED_TYPES: ['.txt', '.md', '.json', '.csv', '.log'],
  ALLOWED_MIME_TYPES: [
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
    'text/log'
  ],
};

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Validation Rules
export const VALIDATION_RULES = {
  SESSION_ID: {
    LENGTH: 6,
    PATTERN: /^[A-Z0-9]{6}$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Session code is required',
      LENGTH: 'Session code must be 6 characters',
      PATTERN: 'Session code must contain only letters and numbers',
    },
  },
  CONTENT: {
    MAX_LENGTH: 50000,
    ERROR_MESSAGES: {
      TOO_LONG: 'Content exceeds maximum length of 50,000 characters',
    },
  },
};

// Feature Flags
export const FEATURES = {
  TYPING_INDICATORS: true,
  FILE_UPLOAD: true,
  DOWNLOAD: true,
  CURSOR_SYNC: false, // Future feature
  VOICE_NOTES: false, // Future feature
  COLLABORATION_CURSORS: false, // Future feature
};

export default {
  API_CONFIG,
  APP_CONFIG,
  UI_CONFIG,
  SOCKET_EVENTS,
  ERROR_TYPES,
  STORAGE_KEYS,
  FILE_CONFIG,
  THEME_CONFIG,
  VALIDATION_RULES,
  FEATURES,
};