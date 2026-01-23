import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Edit3, 
  Users, 
  ChevronRight,
  History,
  X,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import storageService from '../services/storage.service';

const RecentSessions = ({ onSessionSelect, onClearHistory }) => {
  const [recentSessions, setRecentSessions] = useState([]);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadRecentSessions();
    
    // Set up an interval to refresh recent sessions periodically
    const interval = setInterval(() => {
      loadRecentSessions();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Listen for storage changes to update the list in real-time
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'clipboard_recent_sessions') {
        loadRecentSessions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadRecentSessions = () => {
    const sessions = storageService.getRecentSessions();
    setRecentSessions(sessions);
  };

  const handleSessionClick = (sessionId) => {
    onSessionSelect(sessionId);
  };

  const handleRemoveSession = (sessionId, e) => {
    e.stopPropagation();
    storageService.removeRecentSession(sessionId);
    loadRecentSessions();
    toast.success('Session removed from history');
  };

  const handleEditTitle = (session, e) => {
    e.stopPropagation();
    setEditingSession(session.sessionId);
    setEditTitle(session.title);
  };

  const handleSaveTitle = (sessionId) => {
    if (editTitle.trim()) {
      storageService.updateSessionTitle(sessionId, editTitle.trim());
      loadRecentSessions();
      toast.success('Session title updated');
    }
    setEditingSession(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all recent sessions?')) {
      storageService.clearRecentSessions();
      loadRecentSessions();
      onClearHistory?.();
      toast.success('Recent sessions cleared');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'joined':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return '🆕';
      case 'joined':
        return '🔗';
      default:
        return '📋';
    }
  };

  if (recentSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No recent sessions</p>
        <p className="text-gray-400 text-xs mt-1">
          Create or join a session to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
            Recent Sessions
          </h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {recentSessions.length}
          </span>
        </div>
        
        {recentSessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:text-red-700 transition-colors"
            title="Clear all recent sessions"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Sessions List with Scroll - Takes remaining space */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
        {recentSessions.map((session) => (
          <div
            key={session.sessionId}
            onClick={() => handleSessionClick(session.sessionId)}
            className="group bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm">{getActionIcon(session.action)}</span>
                  
                  {editingSession === session.sessionId ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Session title"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTitle(session.sessionId);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveTitle(session.sessionId);
                        }}
                        className="text-green-600 hover:text-green-700 p-1"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="text-gray-600 hover:text-gray-700 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {session.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-blue-600 font-bold">
                            {session.sessionId}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getActionColor(session.action)}`}>
                            {session.action}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleEditTitle(session, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all p-1"
                        title="Edit title"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(session.lastAccessed)}</span>
                    </div>
                    
                    {session.accessCount > 1 && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{session.accessCount}x</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleRemoveSession(session.sessionId, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 flex-shrink-0">
        <p className="text-xs text-gray-400">
          Sessions are stored locally and auto-expire after 24 hours
        </p>
      </div>
    </div>
  );
};

export default RecentSessions;