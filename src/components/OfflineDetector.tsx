import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

// Import offline utils for development testing
if (import.meta.env.DEV) {
  import('@/utils/offlineUtils');
}

const OfflineDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're already on the offline page
    if (location.pathname === '/offline') {
      // If we're on offline page and back online, redirect to home
      if (isOnline) {
        navigate('/', { replace: true });
        toast.success('You\'re back online!');
      }
      return;
    }

    // If we go offline, redirect to offline page
    if (!isOnline) {
      navigate('/offline', { replace: true });
      toast.error('Connection lost - You\'re now offline', {
        description: 'Some features may not work until you reconnect',
        duration: 4000,
      });
    }

    // If we come back online after being offline, show success message
    if (isOnline && wasOffline && location.pathname !== '/offline') {
      toast.success('Welcome back! You\'re online again', {
        description: 'All features have been restored',
        duration: 3000,
      });
    }
  }, [isOnline, wasOffline, navigate, location.pathname]);

  return <>{children}</>;
};

export default OfflineDetector;