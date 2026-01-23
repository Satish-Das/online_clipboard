import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import ClipboardArea from './components/ClipboardArea';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const {
    isConnected,
    currentSession,
    activeUsers,
    isTyping,
    connectionError,
    joinSession,
    leaveSession,
    updateContent,
    startTyping,
    stopTyping,
    socket
  } = useSocket();

  const [showSessionManager, setShowSessionManager] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Show session manager when not in a session
  useEffect(() => {
    setShowSessionManager(!currentSession);
  }, [currentSession]);

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSessionJoin = (sessionId) => {
    joinSession(sessionId);
  };

  const handleLeaveSession = () => {
    leaveSession();
    setShowSessionManager(true);
  };

  const handleSessionExpired = () => {
    // Clear current session and show session manager
    leaveSession();
    setShowSessionManager(true);
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <LoadingSpinner size="lg" text="Initializing Online Clipboard..." />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Connection Error Banner */}
        {connectionError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-800 text-sm font-medium">
                    Connection Error: {connectionError}
                  </span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {showSessionManager ? (
          <SessionManager onSessionJoin={handleSessionJoin} />
        ) : (
          <>
            <Header
              isConnected={isConnected}
              currentSession={currentSession}
              activeUsers={activeUsers}
              onLeaveSession={handleLeaveSession}
            />
            <ClipboardArea
              socket={socket}
              currentSession={currentSession}
              isTyping={isTyping}
              onContentUpdate={updateContent}
              onStartTyping={startTyping}
              onStopTyping={stopTyping}
              activeUsers={activeUsers}
              onSessionExpired={handleSessionExpired}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;