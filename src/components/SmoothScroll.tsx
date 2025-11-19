import { useEffect } from 'react';
import Lenis from 'lenis';

const SmoothScroll = () => {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Skip smooth scroll if user prefers reduced motion or on mobile for better performance
    if (prefersReducedMotion || window.innerWidth < 768) {
      return;
    }

    // Initialize Lenis smooth scroll with optimized settings
    const lenis = new Lenis({
      duration: 0.6, // Even faster for better responsiveness
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // Simpler cubic ease-out
      smooth: true,
      smoothTouch: false, // Disable on touch devices for better performance
      touchMultiplier: 1.5, // Reduced for better control
      infinite: false,
      gestureDirection: 'vertical',
      normalizeWheel: true,
      smoothWheel: true,
    });

    // Expose Lenis instance globally for scroll-to-top functionality
    (window as any).lenis = lenis;

    let rafId: number;
    
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Cleanup
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  return null;
};

export default SmoothScroll;