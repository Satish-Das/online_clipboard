import React, { useState, useEffect } from 'react';
import { Plus, LogIn, Loader2, Sparkles, Shield, Zap, Globe, Smartphone, Tablet, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import clipboardApi from '../services/api.service';
import storageService from '../services/storage.service';
import Footer from './Footer';
import RecentSessions from './RecentSessions';

const SessionManager = ({ onSessionJoin }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showRecentSessions, setShowRecentSessions] = useState(false);
  const [sessionExpiryTimer, setSessionExpiryTimer] = useState(null);

  useEffect(() => {
    // Check if there are recent sessions to show
    const recentSessions = storageService.getRecentSessions();
    setShowRecentSessions(recentSessions.length > 0);
    
    // Listen for storage changes to update recent sessions visibility
    const handleStorageChange = () => {
      const sessions = storageService.getRecentSessions();
      setShowRecentSessions(sessions.length > 0);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Clear expired session from input after 30 minutes
  useEffect(() => {
    if (joinCode && joinCode.length === 6) {
      // Clear any existing timer
      if (sessionExpiryTimer) {
        clearTimeout(sessionExpiryTimer);
      }

      // Set new timer for 30 minutes (1800000 ms)
      const timer = setTimeout(() => {
        setJoinCode('');
        toast('Session code cleared after 30 minutes', { 
          icon: '⏰',
          duration: 3000 
        });
      }, 30 * 60 * 1000);

      setSessionExpiryTimer(timer);
    }

    return () => {
      if (sessionExpiryTimer) {
        clearTimeout(sessionExpiryTimer);
      }
    };
  }, [joinCode]);

  const createNewSession = async () => {
    setIsCreating(true);
    try {
      const response = await clipboardApi.createSession();
      if (response.success) {
        // Add to recent sessions
        storageService.addRecentSession(response.data.sessionId, 'created');
        // Update recent sessions visibility
        setShowRecentSessions(true);
        onSessionJoin(response.data.sessionId);
        toast.success(`Session created: ${response.data.sessionId}`);
      } else {
        toast.error(response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinExistingSession = async (e) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      toast.error('Please enter a session code');
      return;
    }

    if (joinCode.length !== 6) {
      toast.error('Session code must be 6 characters');
      return;
    }

    setIsJoining(true);
    try {
      const response = await clipboardApi.getClipboard(joinCode.toUpperCase());
      if (response.success) {
        // Add to recent sessions
        storageService.addRecentSession(joinCode.toUpperCase(), 'joined');
        // Update recent sessions visibility
        setShowRecentSessions(true);
        onSessionJoin(joinCode.toUpperCase());
      } else {
        toast.error(response.message || 'Session not found');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Session not found or expired');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRecentSessionSelect = async (sessionId) => {
    try {
      // Verify session still exists
      const response = await clipboardApi.getClipboard(sessionId);
      if (response.success) {
        // Update recent sessions
        storageService.addRecentSession(sessionId, 'joined');
        // Update recent sessions visibility
        setShowRecentSessions(true);
        onSessionJoin(sessionId);
      } else {
        toast.error('Session not found or expired');
        // Remove from recent sessions if it doesn't exist
        storageService.removeRecentSession(sessionId);
        const remainingSessions = storageService.getRecentSessions();
        setShowRecentSessions(remainingSessions.length > 0);
      }
    } catch (error) {
      console.error('Error joining recent session:', error);
      toast.error('Session not found or expired');
      // Remove from recent sessions if it doesn't exist
      storageService.removeRecentSession(sessionId);
      const remainingSessions = storageService.getRecentSessions();
      setShowRecentSessions(remainingSessions.length > 0);
    }
  };

  const handleClearHistory = () => {
    setShowRecentSessions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setJoinCode(value);
    }
  };

  const features = [
    {
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />,
      title: "Real-Time Sync",
      description: "Instant synchronization across all devices"
    },
    {
      icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />,
      title: "Secure & Private",
      description: "No registration required, sessions auto-expire"
    },
    {
      icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
      title: "Cross-Platform",
      description: "Works on desktop, tablet, and mobile devices"
    }
  ];

  const deviceSupport = [
    {
      icon: <Smartphone className="w-6 h-6 text-blue-500" />,
      label: "Mobile"
    },
    {
      icon: <Tablet className="w-6 h-6 text-green-500" />,
      label: "Tablet"
    },
    {
      icon: <Monitor className="w-6 h-6 text-purple-500" />,
      label: "Desktop"
    }
  ];

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col lg:overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 lg:w-4 lg:h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Online Clipboard
                </h1>
                <p className="text-sm lg:text-base text-gray-600 hidden sm:block">
                  Share text instantly across all your devices
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Layout (Original) */}
      <div className="lg:hidden flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
          {/* Device Support Icons */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 sm:space-x-6">
              {deviceSupport.map((device, index) => (
                <div key={index} className="flex flex-col items-center space-y-1 sm:space-y-2">
                  <div className="p-2 sm:p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    {device.icon}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">{device.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          {showRecentSessions && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6">
              <RecentSessions 
                onSessionSelect={handleRecentSessionSelect}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}

          {/* Action Cards */}
          <div className="space-y-4 sm:space-y-6">
            {/* Create New Session */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                  Create New Session
                </h3>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Start a new clipboard session and get a unique 6-digit code to share
              </p>
              <button
                onClick={createNewSession}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base min-h-[48px] sm:min-h-[56px]"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                )}
                <span>{isCreating ? 'Creating...' : 'Create New Session'}</span>
              </button>
            </div>

            {/* Join Existing Session */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                  Join Existing Session
                </h3>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Enter a 6-character session code to join an existing clipboard
              </p>
              <form onSubmit={joinExistingSession} className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={handleInputChange}
                    placeholder="ABC123"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 text-center font-mono text-lg sm:text-xl lg:text-2xl tracking-wider border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    maxLength={6}
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                    <span className={`text-xs sm:text-sm font-medium ${joinCode.length === 6 ? 'text-green-500' : 'text-gray-400'}`}>
                      {joinCode.length}/6
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isJoining || joinCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base min-h-[48px] sm:min-h-[56px]"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  <span>{isJoining ? 'Joining...' : 'Join Session'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-center text-base sm:text-lg">
              Why Choose Online Clipboard?
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-white/50 transition-colors" 
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {feature.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{feature.title}</h5>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips for Mobile */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 sm:hidden">
            <h5 className="font-medium text-purple-900 text-sm mb-2">📱 Mobile Tips:</h5>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Add to home screen for quick access</li>
              <li>• Works offline once loaded</li>
              <li>• Swipe to refresh if connection lost</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout (Improved Design) */}
      <div className="hidden lg:flex flex-1 p-6 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto w-full">
          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-8 h-full max-h-[calc(100vh-120px)]">
            
            {/* Left Column - Combined Session Actions */}
            <div className="space-y-6">
              {/* Combined Create & Join Session Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Create New Session Section */}
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Plus className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Create New Session
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base mb-4 leading-relaxed">
                    Start a new clipboard session and get a unique 6-digit code to share
                  </p>
                  <button
                    onClick={createNewSession}
                    disabled={isCreating}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl text-base"
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{isCreating ? 'Creating Session...' : 'Create New Session'}</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Join Existing Session Section */}
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <LogIn className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Join Existing Session
                    </h3>
                  </div>
                  <p className="text-gray-600 text-base mb-4 leading-relaxed">
                    Enter a 6-character session code to join an existing clipboard
                  </p>
                  <form onSubmit={joinExistingSession} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={handleInputChange}
                        placeholder="ABC123"
                        className="w-full px-4 py-3 text-center font-mono text-xl tracking-wider border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        maxLength={6}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className={`text-base font-bold ${joinCode.length === 6 ? 'text-green-500' : 'text-gray-400'}`}>
                          {joinCode.length}/6
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isJoining || joinCode.length !== 6}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl text-base"
                    >
                      {isJoining ? (
                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                      ) : (
                        <LogIn className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span>{isJoining ? 'Joining Session...' : 'Join Session'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Recent Sessions & Stats */}
            <div className="space-y-6">
              {/* Recent Sessions */}
              {showRecentSessions && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-80">
                  <div className="h-full flex flex-col">
                    <RecentSessions 
                      onSessionSelect={handleRecentSessionSelect}
                      onClearHistory={handleClearHistory}
                    />
                  </div>
                </div>
              )}
              
              {/* Quick Stats - Smaller Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-purple-600">30min</div>
                    <div className="text-xs text-purple-700">Session Time</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">6-Digit</div>
                    <div className="text-xs text-blue-700">Session Code</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">Real-Time</div>
                    <div className="text-xs text-green-700">Sync Speed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
};

export default SessionManager;