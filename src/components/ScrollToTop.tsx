import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScrollToTopButton = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down with optimized throttling
  useEffect(() => {
    let ticking = false;
    let lastScrollTime = 0;
    const throttleDelay = 16; // ~60fps max

    const handleScroll = () => {
      const now = performance.now();
      
      if (!ticking && (now - lastScrollTime) > throttleDelay) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          
          // Gradual visibility based on scroll position
          const shouldShow = currentScrollY > 200;
          if (shouldShow !== isVisible) {
            setIsVisible(shouldShow);
          }
          
          lastScrollTime = now;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  // Calculate opacity based on scroll position for ultra-smooth transition
  const opacity = Math.min(Math.max((scrollY - 150) / 150, 0), 1);
  const translateY = Math.max(20 - (scrollY - 150) / 10, 0);

  const scrollToTop = () => {
    // Check if Lenis is available for smooth scrolling
    const lenis = (window as any).lenis;
    if (lenis && lenis.scrollTo) {
      // Use Lenis for optimized scroll to top
      lenis.scrollTo(0, { 
        duration: 0.8,
        easing: (t: number) => 1 - Math.pow(1 - t, 3) // Cubic ease-out
      });
    } else {
      // Fallback to native smooth scroll
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      className="fixed bottom-6 right-4 sm:right-6 z-50 transition-all duration-700 ease-out"
      style={{
        opacity: opacity,
        transform: `translateY(${translateY}px) scale(${0.8 + opacity * 0.2})`,
        pointerEvents: opacity > 0.1 ? 'auto' : 'none'
      }}
    >
      <Button
        onClick={scrollToTop}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:ring-offset-2 focus:ring-offset-background backdrop-blur-sm border border-primary/20"
        size="icon"
        aria-label="Scroll to top"
        style={{
          boxShadow: `0 ${4 + opacity * 8}px ${16 + opacity * 8}px rgba(0, 0, 0, ${0.1 + opacity * 0.15})`
        }}
      >
        <ChevronUp 
          className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200" 
          style={{
            transform: `translateY(${-opacity * 1}px)`
          }}
        />
      </Button>
    </div>
  );
};

export default ScrollToTopButton;