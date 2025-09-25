import { useEffect, useRef, useState } from 'react';
import { preloaderService } from '@/services/preloaderService';

// Hook for optimizing loading performance
export const useLoadingOptimization = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const hasPreloaded = useRef(false);

  // Preload critical resources on mount
  useEffect(() => {
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;

    const preloadCriticalResources = async () => {
      if (!preloaderService.shouldPreload()) return;

      setIsPreloading(true);
      setPreloadProgress(0);

      try {
        // Preload critical fonts
        await preloaderService.preloadFonts([
          { family: 'Space Grotesk', weight: '400' },
          { family: 'Space Grotesk', weight: '600' },
          { family: 'Space Grotesk', weight: '700' },
          { family: 'Inter', weight: '400' },
          { family: 'Inter', weight: '500' },
          { family: 'Inter', weight: '600' }
        ]);
        setPreloadProgress(50);

        // Preload any hero images or critical assets
        const criticalImages = [
          // Add any critical images here
        ];

        if (criticalImages.length > 0) {
          await preloaderService.preloadImages(criticalImages);
        }
        setPreloadProgress(100);

      } catch (error) {
        // Silently handle preload errors
      } finally {
        setIsPreloading(false);
      }
    };

    // Start preloading after a short delay to not block initial render
    setTimeout(preloadCriticalResources, 100);
  }, []);

  return {
    isPreloading,
    preloadProgress
  };
};

// Hook for lazy loading with intersection observer
export const useLazyLoad = (
  callback: () => void | Promise<void>,
  options: {
    rootMargin?: string;
    threshold?: number;
    triggerOnce?: boolean;
  } = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      callback();
      setIsVisible(true);
      setHasTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            callback();
            
            if (triggerOnce) {
              setHasTriggered(true);
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, rootMargin, threshold, triggerOnce, hasTriggered]);

  return {
    elementRef,
    isVisible,
    hasTriggered
  };
};

// Hook for preloading on hover/focus
export const usePreloadOnInteraction = (
  preloadFn: () => Promise<void>,
  events: string[] = ['mouseenter', 'touchstart', 'focus']
) => {
  const elementRef = useRef<HTMLElement>(null);
  const hasPreloaded = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleInteraction = () => {
      if (hasPreloaded.current) return;
      hasPreloaded.current = true;
      preloadFn();
    };

    events.forEach(event => {
      element.addEventListener(event, handleInteraction, { passive: true, once: true });
    });

    return () => {
      events.forEach(event => {
        element.removeEventListener(event, handleInteraction);
      });
    };
  }, [preloadFn, events]);

  return elementRef;
};

// Hook for connection-aware loading
export const useConnectionAwareLoading = () => {
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: '4g',
    saveData: false,
    downlink: 10
  });

  useEffect(() => {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    
    const updateConnectionInfo = () => {
      setConnectionInfo({
        effectiveType: connection.effectiveType || '4g',
        saveData: connection.saveData || false,
        downlink: connection.downlink || 10
      });
    };

    updateConnectionInfo();
    connection.addEventListener('change', updateConnectionInfo);

    return () => {
      connection.removeEventListener('change', updateConnectionInfo);
    };
  }, []);

  const shouldLoadHighQuality = () => {
    return connectionInfo.effectiveType !== 'slow-2g' && 
           connectionInfo.effectiveType !== '2g' && 
           !connectionInfo.saveData;
  };

  const shouldPreload = () => {
    return connectionInfo.effectiveType === '4g' && 
           !connectionInfo.saveData && 
           connectionInfo.downlink > 1.5;
  };

  return {
    connectionInfo,
    shouldLoadHighQuality,
    shouldPreload
  };
};