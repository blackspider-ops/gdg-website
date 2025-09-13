import React, { useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ children }) => {
  const { isLoading } = useContent();

  useEffect(() => {
    // Monitor initial page load performance
    const startTime = performance.now();
    
    const checkLoadComplete = () => {
      if (!isLoading) {
        const loadTime = performance.now() - startTime;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Page loaded in ${loadTime.toFixed(2)}ms`);
          
          // Log performance metrics
          if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
              console.log('📊 Performance Metrics:', {
                'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
                'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
                'Server Response': `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`,
                'DOM Content Loaded': `${(navigation.domContentLoadedEventEnd - navigation.navigationStart).toFixed(2)}ms`,
                'Page Load Complete': `${(navigation.loadEventEnd - navigation.navigationStart).toFixed(2)}ms`
              });
            }
          }
        }
      }
    };

    checkLoadComplete();
  }, [isLoading]);

  // Add loading indicator for slow connections
  useEffect(() => {
    if (isLoading) {
      const slowLoadingTimer = setTimeout(() => {
        // Show slow loading indicator after 2 seconds
        const indicator = document.createElement('div');
        indicator.id = 'slow-loading-indicator';
        indicator.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        indicator.textContent = 'Loading content...';
        document.body.appendChild(indicator);
      }, 2000);

      return () => {
        clearTimeout(slowLoadingTimer);
        const indicator = document.getElementById('slow-loading-indicator');
        if (indicator) {
          indicator.remove();
        }
      };
    } else {
      // Remove slow loading indicator when loading completes
      const indicator = document.getElementById('slow-loading-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
  }, [isLoading]);

  return <>{children}</>;
};

export default PerformanceMonitor;