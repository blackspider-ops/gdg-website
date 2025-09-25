import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = (breakpoints: Partial<BreakpointConfig> = {}) => {
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use ResizeObserver if available, fallback to window resize
    let resizeObserver: ResizeObserver | null = null;
    
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.documentElement);
    } else {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const isMobile = windowSize.width < bp.md;
  const isTablet = windowSize.width >= bp.md && windowSize.width < bp.lg;
  const isDesktop = windowSize.width >= bp.lg;
  const isLargeDesktop = windowSize.width >= bp.xl;
  const isExtraLarge = windowSize.width >= bp['2xl'];

  const breakpoint = (() => {
    if (windowSize.width >= bp['2xl']) return '2xl';
    if (windowSize.width >= bp.xl) return 'xl';
    if (windowSize.width >= bp.lg) return 'lg';
    if (windowSize.width >= bp.md) return 'md';
    return 'sm';
  })();

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isExtraLarge,
    breakpoint,
    // Utility functions
    isAtLeast: (size: keyof BreakpointConfig) => windowSize.width >= bp[size],
    isBelow: (size: keyof BreakpointConfig) => windowSize.width < bp[size],
  };
};

// Device detection utilities
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isTouchDevice: false,
    isLowPowerDevice: false,
    pixelRatio: 1,
    isReducedMotion: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDeviceInfo = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isLowPowerDevice = navigator.hardwareConcurrency <= 4;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setDeviceInfo({
        isTouchDevice,
        isLowPowerDevice,
        pixelRatio,
        isReducedMotion,
      });
    };

    updateDeviceInfo();

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => updateDeviceInfo();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return deviceInfo;
};