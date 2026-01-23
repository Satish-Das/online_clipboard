import { STORAGE_KEYS } from '../config/constants';

/**
 * Local Storage Service for managing session history and user preferences
 */
class StorageService {
  /**
   * Get recent sessions from localStorage
   * @returns {Array} Array of recent session objects
   */
  getRecentSessions() {
    try {
      const sessions = localStorage.getItem(STORAGE_KEYS.RECENT_SESSIONS);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  /**
   * Add a session to recent history
   * @param {string} sessionId - Session ID
   * @param {string} action - 'created' or 'joined'
   * @param {string} [title] - Optional session title/description
   */
  addRecentSession(sessionId, action = 'joined', title = null) {
    try {
      const sessions = this.getRecentSessions();
      
      // Remove existing session if it exists
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
      
      // Create new session object
      const newSession = {
        sessionId,
        action,
        title: title || `Session ${sessionId}`,
        timestamp: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 1
      };

      // Check if session existed before
      const existingSession = sessions.find(s => s.sessionId === sessionId);
      if (existingSession) {
        newSession.accessCount = existingSession.accessCount + 1;
        newSession.title = existingSession.title; // Keep existing title
      }

      // Add to beginning of array
      filteredSessions.unshift(newSession);
      
      // Keep only last 10 sessions
      const recentSessions = filteredSessions.slice(0, 10);
      
      localStorage.setItem(STORAGE_KEYS.RECENT_SESSIONS, JSON.stringify(recentSessions));
      
      console.log(`Added session ${sessionId} to recent history`);
    } catch (error) {
      console.error('Error adding recent session:', error);
    }
  }

  /**
   * Update session title
   * @param {string} sessionId - Session ID
   * @param {string} title - New title
   */
  updateSessionTitle(sessionId, title) {
    try {
      const sessions = this.getRecentSessions();
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      
      if (sessionIndex !== -1) {
        sessions[sessionIndex].title = title;
        sessions[sessionIndex].lastAccessed = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.RECENT_SESSIONS, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  }

  /**
   * Remove a session from recent history
   * @param {string} sessionId - Session ID to remove
   */
  removeRecentSession(sessionId) {
    try {
      const sessions = this.getRecentSessions();
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
      localStorage.setItem(STORAGE_KEYS.RECENT_SESSIONS, JSON.stringify(filteredSessions));
      
      console.log(`Removed session ${sessionId} from recent history`);
    } catch (error) {
      console.error('Error removing recent session:', error);
    }
  }

  /**
   * Clear all recent sessions
   */
  clearRecentSessions() {
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_SESSIONS);
      console.log('Cleared all recent sessions');
    } catch (error) {
      console.error('Error clearing recent sessions:', error);
    }
  }

  /**
   * Get user preferences
   * @returns {Object} User preferences object
   */
  getUserPreferences() {
    try {
      const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        showStats: false,
        autoSave: true,
        theme: 'light',
        notifications: true
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  /**
   * Save user preferences
   * @param {Object} preferences - Preferences object
   */
  saveUserPreferences(preferences) {
    try {
      const currentPrefs = this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Save draft content for a session
   * @param {string} sessionId - Session ID
   * @param {string} content - Draft content
   */
  saveDraftContent(sessionId, content) {
    try {
      const drafts = this.getDraftContent();
      drafts[sessionId] = {
        content,
        timestamp: new Date().toISOString()
      };
      
      // Keep only last 5 drafts
      const draftKeys = Object.keys(drafts);
      if (draftKeys.length > 5) {
        const sortedKeys = draftKeys.sort((a, b) => 
          new Date(drafts[b].timestamp) - new Date(drafts[a].timestamp)
        );
        const keysToKeep = sortedKeys.slice(0, 5);
        const filteredDrafts = {};
        keysToKeep.forEach(key => {
          filteredDrafts[key] = drafts[key];
        });
        localStorage.setItem(STORAGE_KEYS.DRAFT_CONTENT, JSON.stringify(filteredDrafts));
      } else {
        localStorage.setItem(STORAGE_KEYS.DRAFT_CONTENT, JSON.stringify(drafts));
      }
    } catch (error) {
      console.error('Error saving draft content:', error);
    }
  }

  /**
   * Get draft content
   * @returns {Object} Draft content object
   */
  getDraftContent() {
    try {
      const drafts = localStorage.getItem(STORAGE_KEYS.DRAFT_CONTENT);
      return drafts ? JSON.parse(drafts) : {};
    } catch (error) {
      console.error('Error getting draft content:', error);
      return {};
    }
  }

  /**
   * Get draft for specific session
   * @param {string} sessionId - Session ID
   * @returns {string|null} Draft content or null
   */
  getSessionDraft(sessionId) {
    try {
      const drafts = this.getDraftContent();
      return drafts[sessionId]?.content || null;
    } catch (error) {
      console.error('Error getting session draft:', error);
      return null;
    }
  }

  /**
   * Remove draft for specific session
   * @param {string} sessionId - Session ID
   */
  removeSessionDraft(sessionId) {
    try {
      const drafts = this.getDraftContent();
      delete drafts[sessionId];
      localStorage.setItem(STORAGE_KEYS.DRAFT_CONTENT, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error removing session draft:', error);
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage usage info
   * @returns {Object} Storage usage information
   */
  getStorageInfo() {
    if (!this.isStorageAvailable()) {
      return { available: false };
    }

    try {
      const recentSessions = this.getRecentSessions();
      const preferences = this.getUserPreferences();
      const drafts = this.getDraftContent();

      return {
        available: true,
        recentSessionsCount: recentSessions.length,
        draftsCount: Object.keys(drafts).length,
        hasPreferences: Object.keys(preferences).length > 0,
        totalSize: this._calculateStorageSize()
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { available: false };
    }
  }

  /**
   * Calculate approximate storage size
   * @private
   * @returns {number} Size in bytes
   */
  _calculateStorageSize() {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }
    return total;
  }
}

// Create and export singleton instance
const storageService = new StorageService();

export default storageService;
export { StorageService };