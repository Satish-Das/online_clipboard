import axios from 'axios';
import { API_CONFIG } from '../config/constants';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Bad request');
        case 404:
          throw new Error(data.message || 'Resource not found');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

/**
 * Clipboard API Service
 */
class ClipboardApiService {
  /**
   * Create a new clipboard session
   * @returns {Promise<object>} Session data
   */
  async createSession() {
    try {
      const response = await apiClient.post('/clipboard/create');
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get clipboard content by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Clipboard data
   */
  async getClipboard(sessionId) {
    try {
      const response = await apiClient.get(`/clipboard/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching clipboard:', error);
      throw error;
    }
  }

  /**
   * Update clipboard content
   * @param {string} sessionId - Session ID
   * @param {string} content - New content
   * @returns {Promise<object>} Updated clipboard data
   */
  async updateClipboard(sessionId, content) {
    try {
      const response = await apiClient.put(`/clipboard/${sessionId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating clipboard:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session statistics
   */
  async getSessionStats(sessionId) {
    try {
      const response = await apiClient.get(`/clipboard/${sessionId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  }

  /**
   * Get session time remaining
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session time data
   */
  async getSessionTime(sessionId) {
    try {
      const response = await apiClient.get(`/clipboard/${sessionId}/time`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session time:', error);
      throw error;
    }
  }

  /**
   * Extend session expiry
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Extended session data
   */
  async extendSession(sessionId) {
    try {
      const response = await apiClient.post(`/clipboard/${sessionId}/extend`);
      return response.data;
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions
   * @returns {Promise<object>} Cleanup result
   */
  async cleanupExpiredSessions() {
    try {
      const response = await apiClient.post('/clipboard/cleanup');
      return response.data;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Delete session (cleanup)
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Deletion result
   */
  async deleteSession(sessionId) {
    try {
      const response = await apiClient.delete(`/clipboard/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Health check
   * @returns {Promise<object>} Server health status
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking server health:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const clipboardApi = new ClipboardApiService();

export default clipboardApi;
export { ClipboardApiService };