import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import socketService from '../services/socket.service';
import { SOCKET_EVENTS, ERROR_TYPES } from '../config/constants';

/**
 * Custom hook for Socket.IO integration
 * @returns {object} Socket state and methods
 */
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const cleanupFunctions = useRef([]);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        setConnectionError(error.message);
        toast.error('Failed to connect to server');
      }
    };

    initializeSocket();

    // Setup event listeners
    const setupEventListeners = () => {
      // Connection events
      const onConnect = () => {
        setIsConnected(true);
        setConnectionError(null);
        console.log('Connected to server');
      };

      const onDisconnect = (reason) => {
        setIsConnected(false);
        setCurrentSession(null);
        setActiveUsers(0);
        console.log('Disconnected from server:', reason);
        
        if (reason === 'io server disconnect') {
          toast.error('Server disconnected. Please refresh the page.');
        }
      };

      const onConnectError = (error) => {
        console.error('Connection error:', error);
        setConnectionError(error.message);
        toast.error('Failed to connect to server');
      };

      const onReconnect = () => {
        setIsConnected(true);
        setConnectionError(null);
        toast.success('Reconnected to server');
      };

      // Session events
      const onSessionJoined = (data) => {
        setCurrentSession(data.sessionId);
        setActiveUsers(data.activeUsers);
        socketService.setCurrentSession(data.sessionId);
        toast.success(`Joined session ${data.sessionId}`);
      };

      const onUserJoined = (data) => {
        setActiveUsers(data.activeUsers);
        toast.success(data.message, { duration: 2000 });
      };

      const onUserLeft = (data) => {
        setActiveUsers(data.activeUsers);
        toast(data.message, { duration: 2000 });
      };

      const onUserTyping = (data) => {
        setIsTyping(data.typing);
        
        // Auto-clear typing indicator
        if (data.typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      };

      const onSessionLeft = () => {
        setCurrentSession(null);
        setActiveUsers(0);
        socketService.setCurrentSession(null);
        toast.success('Left session');
      };

      // Error handling
      const onError = (error) => {
        console.error('Socket error:', error);
        
        switch (error.type) {
          case ERROR_TYPES.SESSION_NOT_FOUND:
            toast.error('Session not found or expired');
            setCurrentSession(null);
            break;
          case ERROR_TYPES.VALIDATION_ERROR:
            toast.error(error.message);
            break;
          case ERROR_TYPES.UNAUTHORIZED:
            toast.error('Not authorized to perform this action');
            break;
          default:
            toast.error(error.message || 'An error occurred');
        }
      };

      // Register all event listeners
      const listeners = [
        socketService.on(SOCKET_EVENTS.CONNECT, onConnect),
        socketService.on(SOCKET_EVENTS.DISCONNECT, onDisconnect),
        socketService.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError),
        socketService.on(SOCKET_EVENTS.RECONNECT, onReconnect),
        socketService.on(SOCKET_EVENTS.SESSION_JOINED, onSessionJoined),
        socketService.on(SOCKET_EVENTS.USER_JOINED, onUserJoined),
        socketService.on(SOCKET_EVENTS.USER_LEFT, onUserLeft),
        socketService.on(SOCKET_EVENTS.USER_TYPING, onUserTyping),
        socketService.on(SOCKET_EVENTS.SESSION_LEFT, onSessionLeft),
        socketService.on(SOCKET_EVENTS.ERROR, onError),
      ];

      cleanupFunctions.current = listeners;
    };

    if (socketService.getSocket()) {
      setupEventListeners();
    }

    // Cleanup on unmount
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Clean up event listeners
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];

      // Disconnect socket
      socketService.disconnect();
    };
  }, []);

  // Socket methods
  const joinSession = useCallback((sessionId) => {
    try {
      socketService.joinSession(sessionId);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  }, []);

  const leaveSession = useCallback(() => {
    try {
      socketService.leaveSession();
      setCurrentSession(null);
      setActiveUsers(0);
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error('Failed to leave session');
    }
  }, []);

  const updateContent = useCallback((sessionId, content) => {
    try {
      socketService.updateContent(sessionId, content);
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    }
  }, []);

  const startTyping = useCallback((sessionId) => {
    try {
      socketService.startTyping(sessionId);
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }, []);

  const stopTyping = useCallback((sessionId) => {
    try {
      socketService.stopTyping(sessionId);
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }, []);

  const ping = useCallback(() => {
    try {
      socketService.ping();
    } catch (error) {
      console.error('Error sending ping:', error);
    }
  }, []);

  // Content update listener
  const onContentUpdate = useCallback((callback) => {
    const cleanup = socketService.on(SOCKET_EVENTS.CONTENT_UPDATED, callback);
    return cleanup;
  }, []);

  // Content update confirmation listener
  const onContentUpdateConfirmed = useCallback((callback) => {
    const cleanup = socketService.on(SOCKET_EVENTS.CONTENT_UPDATE_CONFIRMED, callback);
    return cleanup;
  }, []);

  return {
    // State
    isConnected,
    currentSession,
    activeUsers,
    isTyping,
    connectionError,
    
    // Methods
    joinSession,
    leaveSession,
    updateContent,
    startTyping,
    stopTyping,
    ping,
    onContentUpdate,
    onContentUpdateConfirmed,
    
    // Socket instance (for advanced usage)
    socket: socketService.getSocket(),
  };
};