import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clipboardApi from '../services/api.service';

const SessionTimer = ({ sessionId, onSessionExpired, onExtendSession }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    let interval;
    let warningShown = false;

    const updateTimer = async () => {
      try {
        const response = await clipboardApi.getSessionTime(sessionId);
        if (response.success && !response.data.expired) {
          const remaining = response.data.timeRemaining;
          setTimeRemaining(remaining);
          setIsExpired(false);

          // Show warning when 5 minutes or less remaining
          if (remaining <= 300 && !warningShown) {
            setShowWarning(true);
            warningShown = true;
            toast.warning('Session expires in 5 minutes!', {
              duration: 5000,
              icon: '⏰'
            });
          }

          // Show critical warning when 1 minute or less remaining
          if (remaining <= 60 && remaining > 0) {
            toast.error(`Session expires in ${remaining} seconds!`, {
              duration: 2000,
              icon: '🚨'
            });
          }

          // Session expired
          if (remaining <= 0) {
            setIsExpired(true);
            setTimeRemaining(0);
            clearInterval(interval);
            toast.error('Session has expired!', {
              duration: 5000,
              icon: '⏰'
            });
            onSessionExpired?.();
          }
        } else {
          // Session not found or expired
          setIsExpired(true);
          setTimeRemaining(0);
          clearInterval(interval);
          onSessionExpired?.();
        }
      } catch (error) {
        console.error('Error fetching session time:', error);
        // Don't show error toast for network issues, just retry
      }
    };

    // Initial fetch
    updateTimer();

    // Update every 30 seconds
    interval = setInterval(updateTimer, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, onSessionExpired]);

  // Separate interval for updating the display every second
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const displayInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) return prev;
        const newTime = prev - 1;
        
        // Show critical warning when 1 minute or less remaining
        if (newTime <= 60 && newTime > 0 && prev > 60) {
          toast.error(`Session expires in ${newTime} seconds!`, {
            duration: 2000,
            icon: '🚨'
          });
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(displayInterval);
  }, [timeRemaining]);

  const handleExtendSession = async () => {
    if (!sessionId || isExtending) return;

    setIsExtending(true);
    try {
      const response = await clipboardApi.extendSession(sessionId);
      if (response.success) {
        setTimeRemaining(response.data.timeRemaining);
        setIsExpired(false);
        setShowWarning(false);
        toast.success('Session extended by 30 minutes!', {
          icon: '✅'
        });
        onExtendSession?.();
      } else {
        toast.error('Failed to extend session');
      }
    } catch (error) {
      console.error('Error extending session:', error);
      toast.error('Failed to extend session');
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '--:--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-600';
    if (timeRemaining <= 300) return 'text-orange-600'; // 5 minutes
    if (timeRemaining <= 600) return 'text-yellow-600'; // 10 minutes
    return 'text-green-600';
  };

  const getBackgroundColor = () => {
    if (isExpired) return 'bg-red-50 border-red-200';
    if (timeRemaining <= 300) return 'bg-orange-50 border-orange-200';
    if (timeRemaining <= 600) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  if (timeRemaining === null) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-w-[160px] sm:min-w-[200px] min-h-[40px]">
        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm text-gray-500 font-mono leading-tight">--:--:--</span>
          <span className="text-xs text-gray-400 leading-tight">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between px-3 py-2 border rounded-lg transition-colors min-w-[160px] sm:min-w-[200px] min-h-[40px] ${getBackgroundColor()}`}>
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        {isExpired ? (
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`text-sm font-mono font-semibold ${getTimerColor()} whitespace-nowrap overflow-hidden leading-tight`}>
            {isExpired ? 'EXPIRED' : formatTime(timeRemaining)}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap overflow-hidden leading-tight">
            {isExpired ? 'Session ended' : 'Time remaining'}
          </span>
        </div>
      </div>

      {!isExpired && timeRemaining <= 600 && ( // Show extend button when 10 minutes or less
        <button
          onClick={handleExtendSession}
          disabled={isExtending}
          className="flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors disabled:opacity-50 flex-shrink-0 min-w-[60px] min-h-[28px]"
          title="Extend session by 30 minutes"
        >
          <RefreshCw className={`w-3 h-3 ${isExtending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-xs">{isExtending ? 'Ext...' : 'Extend'}</span>
        </button>
      )}
    </div>
  );
};

export default SessionTimer;