import React, { useState, useEffect, useRef } from 'react';
import { devConsoleStore } from './devConsoleStore';
import { startConsoleInterceptor, stopConsoleInterceptor } from './consoleInterceptor';
import { startWindowErrorListeners, stopWindowErrorListeners } from './errorListeners';
import { X, Settings, Copy, Trash2, Download, ChevronDown, ChevronRight, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function DevConsoleOverlay() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState(devConsoleStore.getEvents());
  const [unseenCount, setUnseenCount] = useState(devConsoleStore.getUnseenCount());
  const [settings, setSettings] = useState(devConsoleStore.getSettings());
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('DEV_CONSOLE_POSITION');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedStacks, setExpandedStacks] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [buttonColor, setButtonColor] = useState(() => localStorage.getItem('DEV_CONSOLE_BUTTON_COLOR') || '#0f172a');
  const [transparency, setTransparency] = useState(() => parseInt(localStorage.getItem('DEV_CONSOLE_TRANSPARENCY') || '100'));
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('DEV_CONSOLE_DARK_MODE') === 'true');
  const dragRef = useRef(null);
  const hasAutoOpened = useRef(false);

  // Check if dev console should be enabled
  useEffect(() => {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
    const isStaging = hostname.includes('staging') || hostname.includes('preview');
    const isProd = !isDev && !isStaging;

    // Check kill switch
    const killSwitch = localStorage.getItem('DEV_CONSOLE_ENABLED');
    if (killSwitch === 'false') {
      setIsEnabled(false);
      return;
    }

    // Auto-enable in dev/staging
    if (isDev || isStaging) {
      setIsEnabled(true);
      return;
    }

    // In production, check query param or localStorage
    if (isProd) {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('devconsole') === '1';
      const localStorageEnabled = killSwitch === 'true';
      
      if (queryParam || localStorageEnabled) {
        setIsEnabled(true);
        if (queryParam) {
          localStorage.setItem('DEV_CONSOLE_ENABLED', 'true');
        }
      }
    }
  }, []);

  // Start/stop interceptors
  useEffect(() => {
    if (!isEnabled) return;

    startConsoleInterceptor(
      () => devConsoleStore.getSettings(),
      (event) => devConsoleStore.addEvent(event)
    );

    startWindowErrorListeners((event) => devConsoleStore.addEvent(event));

    return () => {
      stopConsoleInterceptor();
      stopWindowErrorListeners();
    };
  }, [isEnabled]);

  // Subscribe to store updates
  useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = devConsoleStore.subscribe(() => {
      setEvents(devConsoleStore.getEvents());
      setUnseenCount(devConsoleStore.getUnseenCount());
      setSettings(devConsoleStore.getSettings());
    });

    return unsubscribe;
  }, [isEnabled]);

  // Auto-open on first error
  useEffect(() => {
    if (!isEnabled || hasAutoOpened.current || !settings.autoOpenOnError) return;

    const errorEvents = events.filter(e => e.type === 'error' || e.type === 'rejection');
    if (errorEvents.length > 0 && !isExpanded) {
      setIsExpanded(true);
      hasAutoOpened.current = true;
    }
  }, [events, isExpanded, settings.autoOpenOnError, isEnabled]);

  // Mark seen when expanded
  useEffect(() => {
    if (isExpanded && unseenCount > 0) {
      devConsoleStore.markAllSeen();
    }
  }, [isExpanded, unseenCount]);

  // Dragging logic (only for collapsed state)
  const handleMouseDown = (e) => {
    if (isExpanded) return; // Don't drag when expanded
    if (e.target.closest('button')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const width = isExpanded ? 360 : 60;
      const height = isExpanded ? 420 : 60;
      
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - height));
      
      const newPosition = { x: newX, y: newY };
      setPosition(newPosition);
      localStorage.setItem('DEV_CONSOLE_POSITION', JSON.stringify(newPosition));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isExpanded]);

  const handleCopy = async (eventId) => {
    const text = eventId ? devConsoleStore.copyEvent(eventId) : devConsoleStore.copyAll();
    try {
      await navigator.clipboard.writeText(text);
      toast.success(eventId ? 'Error copied' : 'All errors copied');
    } catch (e) {
      toast.error('Failed to copy');
    }
  };

  const handleClear = () => {
    devConsoleStore.clear();
    setExpandedStacks(new Set());
  };

  const handleExport = () => {
    const json = devConsoleStore.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-console-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStack = (eventId) => {
    const newSet = new Set(expandedStacks);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setExpandedStacks(newSet);
  };

  if (!isEnabled) return null;

  const typeColors = {
    error: 'bg-red-100 text-red-800 border-red-200',
    warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    rejection: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const typeBadgeColors = {
    error: 'bg-red-500',
    warn: 'bg-yellow-500',
    info: 'bg-blue-500',
    rejection: 'bg-purple-500'
  };

  if (!isExpanded) {
    // Collapsed floating button
    return (
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 9999,
          backgroundColor: buttonColor
        }}
        className="w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xs hover:opacity-90 transition-all select-none"
      >
        DEV
        {unseenCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            {unseenCount > 99 ? '99+' : unseenCount}
          </div>
        )}
      </div>
    );
  }

  // Expanded panel (full-height column on right)
  return (
    <div
      ref={dragRef}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '100vw',
        zIndex: 9999,
        opacity: transparency / 100
      }}
      className={`shadow-2xl border-l flex flex-col overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between select-none ${
          darkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">Dev Console</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            darkMode ? 'bg-slate-700' : 'bg-slate-700'
          }`}>
            {events.filter(e => e.type === 'error' || e.type === 'rejection').length} errors
          </span>
        </div>
      </div>

      {/* Status bar */}
      <div className={`px-4 py-2 border-b text-xs flex items-center gap-2 ${
        darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <span className="font-semibold">Route:</span>
        <span className="font-mono truncate flex-1">{window.location.pathname}</span>
      </div>

      {/* Events list */}
      <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${darkMode ? 'bg-slate-900' : ''}`}>
        {events.length === 0 ? (
          <div className={`text-center py-8 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            No events captured yet
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-3 text-xs ${typeColors[event.type]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${typeBadgeColors[event.type]}`} />
                  <span className="font-bold uppercase">{event.type}</span>
                  <span className="text-slate-600">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(event.id)}
                  className="p-1 hover:bg-black/10 rounded"
                  title="Copy this error"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              <div className="font-mono text-xs mb-2 break-words">
                {event.message}
              </div>

              {event.stack && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleStack(event.id)}
                    className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold"
                  >
                    {expandedStacks.has(event.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Stack trace
                  </button>
                  {expandedStacks.has(event.id) && (
                    <pre className="mt-1 p-2 bg-black/5 rounded text-xs overflow-x-auto">
                      {event.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="mt-2 text-xs text-slate-500 font-mono truncate">
                {event.route}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Dev Console Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Button Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => {
                      setButtonColor(e.target.value);
                      localStorage.setItem('DEV_CONSOLE_BUTTON_COLOR', e.target.value);
                    }}
                    className="w-12 h-12 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={buttonColor}
                    onChange={(e) => {
                      setButtonColor(e.target.value);
                      localStorage.setItem('DEV_CONSOLE_BUTTON_COLOR', e.target.value);
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Console Transparency: {transparency}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={transparency}
                  onChange={(e) => {
                    setTransparency(parseInt(e.target.value));
                    localStorage.setItem('DEV_CONSOLE_TRANSPARENCY', e.target.value);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>20%</span>
                  <span>100%</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setButtonColor('#0f172a');
                  setTransparency(100);
                  localStorage.setItem('DEV_CONSOLE_BUTTON_COLOR', '#0f172a');
                  localStorage.setItem('DEV_CONSOLE_TRANSPARENCY', '100');
                }}
                className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium text-slate-700"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className={`border-t p-3 space-y-2 ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Action buttons */}
        <div className={`flex items-center gap-1 pb-2 border-b ${
          darkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Copy All"
          >
            <Copy className="w-3 h-3" />
            Copy All
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newDarkMode = !darkMode;
              setDarkMode(newDarkMode);
              localStorage.setItem('DEV_CONSOLE_DARK_MODE', newDarkMode.toString());
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs ml-auto"
            title="Close"
          >
            <X className="w-3 h-3" />
            Close
          </button>
        </div>

        <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-slate-300' : ''}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.captureWarnings}
              onChange={(e) => devConsoleStore.setSetting('captureWarnings', e.target.checked)}
              className="rounded"
            />
            <span>Warnings</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.captureLogs}
              onChange={(e) => devConsoleStore.setSetting('captureLogs', e.target.checked)}
              className="rounded"
            />
            <span>Logs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoOpenOnError}
              onChange={(e) => devConsoleStore.setSetting('autoOpenOnError', e.target.checked)}
              className="rounded"
            />
            <span>Auto-open</span>
          </label>
        </div>
        <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-slate-300' : ''}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paused}
              onChange={(e) => devConsoleStore.setSetting('paused', e.target.checked)}
              className="rounded"
            />
            <span>Pause capture</span>
          </label>
          <button
            onClick={handleExport}
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}