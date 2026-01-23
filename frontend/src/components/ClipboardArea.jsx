import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  FileText,
  Users,
  Clock,
  BarChart3,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import clipboardApi from '../services/api.service';
import storageService from '../services/storage.service';
import SessionTimer from './SessionTimer';

const ClipboardArea = ({ 
  socket, 
  currentSession, 
  isTyping, 
  onContentUpdate, 
  onStartTyping, 
  onStopTyping,
  activeUsers,
  onSessionExpired
}) => {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ words: 0, lines: 0, characters: 0 });
  const [showStats, setShowStats] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load initial content when session changes
  useEffect(() => {
    if (currentSession) {
      loadSessionContent();
      // Update recent sessions when entering a session
      storageService.addRecentSession(currentSession, 'joined');
    }
  }, [currentSession]);

  // Listen for real-time content updates
  useEffect(() => {
    if (!socket) return;

    const handleContentUpdate = (data) => {
      setContent(data.content);
      setLastSaved(new Date(data.timestamp));
      toast.success('Updated by another user', { 
        duration: 2000,
        icon: '👥'
      });
    };

    socket.on('content-updated', handleContentUpdate);

    return () => {
      socket.off('content-updated', handleContentUpdate);
    };
  }, [socket]);

  // Update stats when content changes
  useEffect(() => {
    const characters = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    
    setStats({ characters, words, lines });
  }, [content]);

  // Auto-save draft content to localStorage
  useEffect(() => {
    if (currentSession && content) {
      const draftTimeout = setTimeout(() => {
        storageService.saveDraftContent(currentSession, content);
      }, 5000); // Save draft every 5 seconds

      return () => clearTimeout(draftTimeout);
    }
  }, [content, currentSession]);

  const loadSessionContent = async () => {
    try {
      const response = await clipboardApi.getClipboard(currentSession);
      if (response.success) {
        setContent(response.data.content);
        setLastSaved(response.data.lastActivity ? new Date(response.data.lastActivity) : null);
        
        // Check for draft content if server content is empty
        if (!response.data.content) {
          const draft = storageService.getSessionDraft(currentSession);
          if (draft) {
            setContent(draft);
            toast.success('Restored draft content', { icon: '📝' });
          }
        } else {
          // Remove draft if server has content
          storageService.removeSessionDraft(currentSession);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
      
      // Check if session expired
      if (error.message?.includes('expired') || error.message?.includes('not found')) {
        toast.error('Session has expired or not found');
        onSessionExpired?.();
        return;
      }
      
      toast.error('Failed to load content');
      
      // Try to load draft content as fallback
      const draft = storageService.getSessionDraft(currentSession);
      if (draft) {
        setContent(draft);
        toast.success('Loaded draft content', { icon: '📝' });
      }
    }
  };

  const saveContent = async (newContent) => {
    if (!currentSession) return;

    setIsSaving(true);
    try {
      const response = await clipboardApi.updateClipboard(currentSession, newContent);
      if (response.success) {
        setLastSaved(new Date());
        onContentUpdate(currentSession, newContent);
        
        // Update session in recent history with activity
        storageService.addRecentSession(currentSession, 'joined');
        
        // Remove draft since content is saved
        storageService.removeSessionDraft(currentSession);
        
        toast.success('Saved!', { icon: '💾' });
      } else {
        toast.error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      
      // Check if session expired
      if (error.message?.includes('expired') || error.message?.includes('not found')) {
        toast.error('Session has expired');
        onSessionExpired?.();
        return;
      }
      
      toast.error('Failed to save');
      
      // Save as draft if server save fails
      storageService.saveDraftContent(currentSession, newContent);
      toast('Saved as draft', { icon: '📝' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Handle typing indicators
    onStartTyping(currentSession);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping(currentSession);
    }, 1000);

    // Auto-save with debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 2000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied!', { icon: '📋' });
    } catch (error) {
      textareaRef.current?.select();
      document.execCommand('copy');
      toast.success('Copied!', { icon: '📋' });
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newContent = content + text;
      setContent(newContent);
      saveContent(newContent);
      toast.success('Pasted!', { icon: '📥' });
    } catch (error) {
      toast.error('Paste manually or grant clipboard permission');
    }
  };

  const clearContent = () => {
    if (content.length > 0) {
      if (window.confirm('Clear all content?')) {
        setContent('');
        saveContent('');
        storageService.removeSessionDraft(currentSession);
        toast.success('Cleared', { icon: '🗑️' });
      }
    }
  };

  const downloadAsFile = () => {
    if (!content.trim()) {
      toast.error('No content to download');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipboard-${currentSession}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded!', { icon: '⬇️' });
  };

  const uploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('File too large (max 1MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      const newContent = content + (content ? '\n\n' : '') + fileContent;
      setContent(newContent);
      saveContent(newContent);
      toast.success('File added!', { icon: '📁' });
    };
    reader.readAsText(file);
    
    e.target.value = '';
  };

  const manualSave = () => {
    saveContent(content);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setShowToolbar(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Enhanced Toolbar */}
      <div className={`bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${showToolbar || !isFullscreen ? 'block' : 'hidden'}`}>
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
          {/* Mobile Toolbar Toggle */}
          <div className="sm:hidden mb-2">
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showToolbar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-sm">Tools</span>
            </button>
          </div>

          <div className={`${showToolbar ? 'block' : 'hidden sm:block'}`}>
            <div className="toolbar-row flex-col lg:flex-row lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
              {/* Left Actions */}
              <div className="toolbar-container">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!content}
                    className="btn-toolbar bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
                    title="Copy all content"
                  >
                    <Copy className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  
                  <button
                    onClick={pasteFromClipboard}
                    className="btn-toolbar bg-green-50 hover:bg-green-100 text-green-700 min-w-[70px]"
                    title="Paste from clipboard"
                  >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Paste</span>
                  </button>
                  
                  <button
                    onClick={clearContent}
                    disabled={!content}
                    className="btn-toolbar bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
                    title="Clear all content"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
                
                <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={downloadAsFile}
                    disabled={!content}
                    className="btn-toolbar bg-purple-50 hover:bg-purple-100 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
                    title="Download as text file"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  
                  <label className="btn-toolbar bg-orange-50 hover:bg-orange-100 text-orange-700 cursor-pointer min-w-[70px]">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json,.csv"
                      onChange={uploadFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Right Actions - Timer and Controls */}
              <div className="flex items-center justify-between lg:justify-end space-x-2 lg:space-x-3">
                {/* Session Timer */}
                <div className="timer-container">
                  <SessionTimer 
                    sessionId={currentSession}
                    onSessionExpired={onSessionExpired}
                    onExtendSession={() => {
                      // Refresh content after extending session
                      loadSessionContent();
                    }}
                  />
                </div>

                <div className="toolbar-container">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="btn-toolbar bg-gray-50 hover:bg-gray-100 text-gray-700 min-w-[70px]"
                    title="Toggle statistics"
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Stats</span>
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="btn-toolbar bg-gray-50 hover:bg-gray-100 text-gray-700 lg:hidden min-w-[50px]"
                    title="Toggle fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4 flex-shrink-0" /> : <Maximize2 className="w-4 h-4 flex-shrink-0" />}
                  </button>

                  <button
                    onClick={manualSave}
                    disabled={isSaving}
                    className="btn-toolbar bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 min-w-[80px]"
                    title="Save now"
                  >
                    <Save className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">
                      {isSaving ? 'Saving...' : 'Save'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            {showStats && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.characters.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Characters</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.words.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Words</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.lines.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Lines</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {isTyping && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>Someone is typing...</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-gray-500">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{activeUsers} active</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4 text-gray-500">
                {isSaving && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                    <span>Auto-saving...</span>
                  </div>
                )}
                
                {lastSaved && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span title={lastSaved.toLocaleString()}>
                      Saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Toolbar Toggle */}
      {isFullscreen && !showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className="absolute top-4 right-4 z-10 bg-white shadow-lg rounded-lg p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="h-full bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden mobile-textarea-container tablet-textarea-container desktop-textarea-container">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing your content here... 

✨ Your text syncs automatically across all devices
📱 Share your session code to collaborate  
💾 Content auto-saves every 2 seconds
⏰ Sessions expire after 30 minutes

Happy sharing! 🚀"
            className="w-full h-full resize-none border-0 focus:outline-none text-gray-900 placeholder-gray-400 p-3 sm:p-4 lg:p-6 custom-scrollbar text-sm sm:text-base mobile-textarea tablet-textarea desktop-textarea"
            style={{ 
              lineHeight: '1.6',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ClipboardArea;