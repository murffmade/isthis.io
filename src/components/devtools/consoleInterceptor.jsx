// Console Interceptor - Wraps console methods to capture output

const originalMethods = {};
let isIntercepting = false;

export function startConsoleInterceptor(getSettings, addEvent) {
  if (isIntercepting) return;
  isIntercepting = true;

  // Save originals
  originalMethods.error = console.error;
  originalMethods.warn = console.warn;
  originalMethods.log = console.log;

  // Intercept error
  console.error = (...args) => {
    try {
      captureConsoleCall('error', args, addEvent);
    } catch (e) {
      // Fail silently
    }
    originalMethods.error?.apply(console, args);
  };

  // Intercept warn
  console.warn = (...args) => {
    try {
      if (getSettings().captureWarnings) {
        captureConsoleCall('warn', args, addEvent);
      }
    } catch (e) {
      // Fail silently
    }
    originalMethods.warn?.apply(console, args);
  };

  // Intercept log
  console.log = (...args) => {
    try {
      if (getSettings().captureLogs) {
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

function captureConsoleCall(type, args, addEvent) {
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  let stack;
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