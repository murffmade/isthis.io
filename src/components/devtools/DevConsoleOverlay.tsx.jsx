import React, { useState, useEffect, useRef } from 'react';
import { devConsoleStore } from './devConsoleStore';
import { startConsoleInterceptor, stopConsoleInterceptor } from './consoleInterceptor';
import { startWindowErrorListeners, stopWindowErrorListeners } from './errorListeners';
import { X, Minimize2, Copy, Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const dragRef = useRef<HTMLDivElement>(null);
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

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - (isExpanded ? 360 : 60)));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - (isExpanded ? 420 : 60)));
      
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

  const handleCopy = async (eventId?: string) => {
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

  const toggleStack = (eventId: string) => {
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
          zIndex: 9999
        }}
        className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xs hover:bg-slate-800 transition-colors select-none"
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

  // Expanded panel
  return (
    <div
      ref={dragRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '360px',
        maxWidth: 'calc(100vw - 20px)',
        height: '420px',
        maxHeight: 'calc(100vh - 20px)',
        zIndex: 9999
      }}
      className="bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between cursor-grab select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">Dev Console</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
            {events.filter(e => e.type === 'error' || e.type === 'rejection').length} errors
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Copy All"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
        <span className="font-semibold">Route:</span>
        <span className="font-mono truncate flex-1">{window.location.pathname}</span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
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

      {/* Footer controls */}
      <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between text-xs">
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
        <div className="flex items-center justify-between text-xs">
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
            className="flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}