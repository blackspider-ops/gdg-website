import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline and now we're online, we might want to show a notification
      if (wasOffline) {
        console.log('Back online!');
        // You could show a toast notification here
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('Gone offline!');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional check with a ping to ensure we're really online
    const checkConnection = async () => {
      if (navigator.onLine) {
        try {
          // Try to fetch a small resource to verify connection
          const response = await fetch('/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache'
          });
          setIsOnline(response.ok);
        } catch {
          setIsOnline(false);
          setWasOffline(true);
        }
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};