// Console Interceptor - Wraps console methods to capture output

import { DevConsoleSettings } from './devConsoleStore';

type ConsoleMethod = 'error' | 'warn' | 'log';

const originalMethods: Partial<Record<ConsoleMethod, any>> = {};

let isIntercepting = false;

export function startConsoleInterceptor(
  settings: () => DevConsoleSettings,
  addEvent: (event: any) => void
) {
  if (isIntercepting) return;
  isIntercepting = true;

  // Save originals
  originalMethods.error = console.error;
  originalMethods.warn = console.warn;
  originalMethods.log = console.log;

  // Intercept error
  console.error = (...args: any[]) => {
    try {
      captureConsoleCall('error', args, addEvent);
    } catch (e) {
      // Fail silently
    }
    originalMethods.error?.apply(console, args);
  };

  // Intercept warn
  console.warn = (...args: any[]) => {
    try {
      if (settings().captureWarnings) {
        captureConsoleCall('warn', args, addEvent);
      }
    } catch (e) {
      // Fail silently
    }
    originalMethods.warn?.apply(console, args);
  };

  // Intercept log
  console.log = (...args: any[]) => {
    try {
      if (settings().captureLogs) {
        captureConsoleCall('info', args, addEvent);
      }
    } catch (e) {
      // Fail silently
    }
    originalMethods.log?.apply(console, args);
  };
}

export function stopConsoleInterceptor() {
  if (!isIntercepting) return;
  isIntercepting = false;

  // Restore originals
  if (originalMethods.error) console.error = originalMethods.error;
  if (originalMethods.warn) console.warn = originalMethods.warn;
  if (originalMethods.log) console.log = originalMethods.log;
}

function captureConsoleCall(
  type: 'error' | 'warn' | 'info',
  args: any[],
  addEvent: (event: any) => void
) {
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  let stack: string | undefined;
  const errorArg = args.find(arg => arg instanceof Error);
  if (errorArg) {
    stack = errorArg.stack;
  } else {
    // Try to capture stack trace
    try {
      const stackTrace = new Error().stack;
      if (stackTrace) {
        // Remove first 3 lines (Error constructor + this function + console wrapper)
        stack = stackTrace.split('\n').slice(3).join('\n');
      }
    } catch (e) {
      // No stack available
    }
  }

  addEvent({
    type,
    timestamp: Date.now(),
    route: window.location.pathname + window.location.search + window.location.hash,
    message,
    stack,
    context: args.length > 1 ? args : args[0]
  });
}