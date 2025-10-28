// Utility functions for offline functionality

export const simulateOffline = () => {
  // This is for testing purposes only
  if (import.meta.env.DEV) {
    console.log('Simulating offline mode...');
    // Temporarily override navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    // Dispatch offline event
    window.dispatchEvent(new Event('offline'));
  }
};

export const simulateOnline = () => {
  // This is for testing purposes only
  if (import.meta.env.DEV) {
    console.log('Simulating online mode...');
    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    // Dispatch online event
    window.dispatchEvent(new Event('online'));
  }
};

export const checkRealConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a small resource to verify real connection
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Add to window for easy testing in dev tools
if (import.meta.env.DEV) {
  (window as any).offlineUtils = {
    simulateOffline,
    simulateOnline,
    checkRealConnection
  };
}