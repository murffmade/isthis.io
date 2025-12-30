// Error Listeners - Listen for uncaught errors and promise rejections

let isListening = false;
let errorHandler: ((event: ErrorEvent) => void) | null = null;
let rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

export function startWindowErrorListeners(addEvent: (event: any) => void) {
  if (isListening) return;
  isListening = true;

  // Uncaught errors
  errorHandler = (event: ErrorEvent) => {
    addEvent({
      type: 'error',
      timestamp: Date.now(),
      route: window.location.pathname + window.location.search + window.location.hash,
      message: event.message || 'Uncaught Error',
      stack: event.error?.stack || `at ${event.filename}:${event.lineno}:${event.colno}`,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? {
          name: event.error.name,
          message: event.error.message
        } : null
      }
    });
  };

  // Unhandled promise rejections
  rejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    let message = 'Unhandled Promise Rejection';
    let stack: string | undefined;
    let context: any = reason;

    if (reason instanceof Error) {
      message = `${reason.name}: ${reason.message}`;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      try {
        message = JSON.stringify(reason);
      } catch {
        message = String(reason);
      }
    }

    addEvent({
      type: 'rejection',
      timestamp: Date.now(),
      route: window.location.pathname + window.location.search + window.location.hash,
      message,
      stack,
      context
    });
  };

  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
}

export function stopWindowErrorListeners() {
  if (!isListening) return;
  isListening = false;

  if (errorHandler) {
    window.removeEventListener('error', errorHandler);
    errorHandler = null;
  }

  if (rejectionHandler) {
    window.removeEventListener('unhandledrejection', rejectionHandler);
    rejectionHandler = null;
  }
}