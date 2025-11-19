import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline and now we're online, we might want to show a notification
      if (wasOffline) {
        // Back online
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Listen for online/offline events - these are reliable and don't cause false positives
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Only do connection verification when the user actively tries to use the app
    // Remove the periodic checking that was causing false offline detections

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Method to manually check connection (used by retry buttons)
  const checkRealConnection = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return { isOnline, wasOffline, checkRealConnection };
};