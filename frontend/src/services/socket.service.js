import { io } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS, APP_CONFIG } from '../config/constants';

/**
 * Socket.IO Service for real-time communication
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentSession = null;
    this.reconnectAttempts = 0;
    this.eventListeners = new Map();
  }

  /**
   * Initialize socket connection
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(API_CONFIG.SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: APP_CONFIG.RECONNECT_ATTEMPTS,
          reconnectionDelay: APP_CONFIG.RECONNECT_DELAY,
        });

        // Connection events
        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
          console.log('🔌 Connected to server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
          console.log('🔌 Disconnected from server:', reason);
          this.isConnected = false;
          this.currentSession = null;
        });

        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
          console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
          console.error('❌ Reconnection error:', error);
          this.reconnectAttempts++;
        });

      } catch (error) {
        console.error('❌ Socket initialization error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentSession = null;
      this.eventListeners.clear();
      console.log('🔌 Socket disconnected');
    }
  }

  /**
   * Join a clipboard session
   * @param {string} sessionId - Session ID to join
   */
  joinSession(sessionId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    console.log(`📋 Joining session: ${sessionId}`);
    this.socket.emit(SOCKET_EVENTS.JOIN_SESSION, sessionId);
  }

  /**
   * Leave current session
   */
  leaveSession() {
    if (!this.socket || !this.currentSession) {
      return;
    }

    console.log(`📋 Leaving session: ${this.currentSession}`);
    this.socket.emit(SOCKET_EVENTS.LEAVE_SESSION);
    this.currentSession = null;
  }

  /**
   * Update clipboard content
   * @param {string} sessionId - Session ID
   * @param {string} content - New content
   */
  updateContent(sessionId, content) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit(SOCKET_EVENTS.CONTENT_UPDATE, {
      sessionId,
      content,
    });
  }

  /**
   * Start typing indicator
   * @param {string} sessionId - Session ID
   */
  startTyping(sessionId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit(SOCKET_EVENTS.TYPING_START, sessionId);
  }

  /**
   * Stop typing indicator
   * @param {string} sessionId - Session ID
   */
  stopTyping(sessionId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit(SOCKET_EVENTS.TYPING_STOP, sessionId);
  }

  /**
   * Send ping to server
   */
  ping() {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit(SOCKET_EVENTS.PING);
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Event callback
   * @returns {function} Cleanup function
   */
  on(event, callback) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    // Store listener for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    this.socket.on(event, callback);

    // Return cleanup function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Event callback
   */
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    this.socket.off(event, callback);

    // Remove from tracking
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners(event);
    this.eventListeners.delete(event);
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get current session
   * @returns {string|null} Current session ID
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Set current session
   * @param {string} sessionId - Session ID
   */
  setCurrentSession(sessionId) {
    this.currentSession = sessionId;
  }

  /**
   * Get socket instance (for advanced usage)
   * @returns {object|null} Socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Create and export singleton instance
const socketService = new SocketService();

export default socketService;
export { SocketService };