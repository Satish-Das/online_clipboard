import React from 'react';
import { Clipboard, Users, Wifi, WifiOff, LogOut, Copy, Menu } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = ({ isConnected, currentSession, activeUsers, onLeaveSession }) => {
  const copySessionCode = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession);
      toast.success('Session code copied!');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <Clipboard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                Online Clipboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block truncate">
                Share text instantly
              </p>
            </div>
          </div>

          {/* Status and Session Info */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0">
            {/* Connection Status */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 sm:space-x-2 text-green-600 px-2 py-1 rounded-lg bg-green-50">
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium hidden md:inline">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2 text-red-600 px-2 py-1 rounded-lg bg-red-50">
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium hidden md:inline">Offline</span>
                </div>
              )}
            </div>

            {/* Session Info */}
            {currentSession && (
              <>
                {/* Active Users - Hidden on small screens */}
                <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg min-h-[32px]">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {activeUsers}
                  </span>
                </div>
                
                {/* Session Code */}
                <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg min-h-[32px]">
                  <span className="text-xs sm:text-sm font-mono font-bold text-blue-700">
                    {currentSession}
                  </span>
                  <button
                    onClick={copySessionCode}
                    className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-100 flex-shrink-0"
                    title="Copy session code"
                  >
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>

                {/* Leave Session */}
                <button
                  onClick={onLeaveSession}
                  className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 min-h-[32px] min-w-[60px] sm:min-w-[80px]"
                  title="Leave session"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium hidden lg:inline">Leave</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Session Info Bar */}
        {currentSession && (
          <div className="sm:hidden pb-2 border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{activeUsers} user{activeUsers !== 1 ? 's' : ''}</span>
                </div>
                <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isConnected ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <div className="text-gray-500">
                Session: <span className="font-mono font-bold text-blue-700">{currentSession}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;