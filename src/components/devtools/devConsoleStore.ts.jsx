// Dev Console Store - Central state for dev console events and settings

export interface DevConsoleEvent {
  id: string;
  type: 'error' | 'warn' | 'info' | 'rejection';
  timestamp: number;
  route: string;
  message: string;
  stack?: string;
  context?: any;
  seen: boolean;
}

export interface DevConsoleSettings {
  captureWarnings: boolean;
  captureLogs: boolean;
  autoOpenOnError: boolean;
  paused: boolean;
}

const MAX_EVENTS = 200;

class DevConsoleStore {
  private events: DevConsoleEvent[] = [];
  private settings: DevConsoleSettings = {
    captureWarnings: true,
    captureLogs: false,
    autoOpenOnError: true,
    paused: false
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('DEV_CONSOLE_SETTINGS');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.warn('Failed to load dev console settings', e);
      }
    }
  }

  addEvent(event: Omit<DevConsoleEvent, 'id' | 'seen'>) {
    if (this.settings.paused) return;

    const newEvent: DevConsoleEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
      seen: false
    };

    this.events.unshift(newEvent);

    // Trim to max
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(0, MAX_EVENTS);
    }

    this.notify();
  }

  getEvents(): DevConsoleEvent[] {
    return this.events;
  }

  getUnseenCount(): number {
    return this.events.filter(e => !e.seen).length;
  }

  markAllSeen() {
    this.events.forEach(e => e.seen = true);
    this.notify();
  }

  clear() {
    this.events = [];
    this.notify();
  }

  getSettings(): DevConsoleSettings {
    return this.settings;
  }

  setSetting<K extends keyof DevConsoleSettings>(key: K, value: DevConsoleSettings[K]) {
    this.settings[key] = value;
    localStorage.setItem('DEV_CONSOLE_SETTINGS', JSON.stringify(this.settings));
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  copyEvent(id: string): string {
    const event = this.events.find(e => e.id === id);
    if (!event) return '';
    return this.formatEvent(event);
  }

  copyAll(): string {
    if (this.events.length === 0) return 'No events captured';

    const summary = [
      '[DEV CONSOLE SUMMARY]',
      `Total Events: ${this.events.length}`,
      `First Seen: ${new Date(this.events[this.events.length - 1].timestamp).toISOString()}`,
      `Last Seen: ${new Date(this.events[0].timestamp).toISOString()}`,
      `Errors: ${this.events.filter(e => e.type === 'error').length}`,
      `Warnings: ${this.events.filter(e => e.type === 'warn').length}`,
      `Rejections: ${this.events.filter(e => e.type === 'rejection').length}`,
      '[/DEV CONSOLE SUMMARY]',
      ''
    ].join('\n');

    const events = this.events.map(e => this.formatEvent(e)).join('\n\n');
    return summary + events;
  }

  exportJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      events: this.events,
      settings: this.settings
    }, null, 2);
  }

  private formatEvent(event: DevConsoleEvent): string {
    return [
      '[DEV CONSOLE ERROR]',
      `app: ${window.location.hostname}`,
      `env: ${this.getEnvironment()}`,
      `timestamp: ${new Date(event.timestamp).toISOString()}`,
      `route: ${event.route}`,
      `type: ${event.type}`,
      `message: ${event.message}`,
      'stack:',
      event.stack || '(none)',
      'context:',
      event.context ? this.safeStringify(event.context) : '(none)',
      '[/DEV CONSOLE ERROR]'
    ].join('\n');
  }

  private getEnvironment(): string {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
    if (hostname.includes('staging') || hostname.includes('preview')) return 'staging';
    return 'production';
  }

  private safeStringify(obj: any, maxDepth = 3): string {
    const seen = new WeakSet();
    const stringify = (val: any, depth = 0): any => {
      if (depth > maxDepth) return '[Max Depth]';
      if (val === null) return null;
      if (val === undefined) return 'undefined';
      
      const type = typeof val;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        return val;
      }

      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack
        };
      }

      if (type === 'function') return '[Function]';
      if (type === 'symbol') return val.toString();

      if (typeof val === 'object') {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);

        if (Array.isArray(val)) {
          if (val.length > 50) {
            return [...val.slice(0, 50).map(v => stringify(v, depth + 1)), '...[truncated]'];
          }
          return val.map(v => stringify(v, depth + 1));
        }

        const obj: any = {};
        const keys = Object.keys(val).slice(0, 50);
        for (const key of keys) {
          try {
            obj[key] = stringify(val[key], depth + 1);
          } catch (e) {
            obj[key] = '[Error accessing property]';
          }
        }
        if (Object.keys(val).length > 50) {
          obj['...'] = '[truncated]';
        }
        return obj;
      }

      return String(val);
    };

    try {
      return JSON.stringify(stringify(obj), null, 2);
    } catch (e) {
      return '[Serialization Error]';
    }
  }
}

export const devConsoleStore = new DevConsoleStore();