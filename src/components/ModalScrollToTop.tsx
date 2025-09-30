import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalScrollToTopProps {
  containerRef: React.RefObject<HTMLElement>;
  threshold?: number;
}

const ModalScrollToTop: React.FC<ModalScrollToTopProps> = ({ 
  containerRef, 
  threshold = 200 
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop;
          setScrollY(currentScrollY);
          
          const shouldShow = currentScrollY > threshold * 0.75; // Start showing earlier
          if (shouldShow !== isVisible) {
            setIsVisible(shouldShow);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, threshold, isVisible]);

  const scrollToTop = () => {
    const container = containerRef.current;
    if (!container) return;

    // Smooth scroll to top of modal content
    container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Calculate opacity and transform for smooth transition
  const startFade = threshold * 0.75;
  const endFade = threshold;
  const opacity = Math.min(Math.max((scrollY - startFade) / (endFade - startFade), 0), 1);
  const translateY = Math.max(15 - (scrollY - startFade) / 8, 0);

  return (
    <div 
      className="absolute bottom-20 right-6 z-20 transition-all duration-500 ease-out"
      style={{
        opacity: opacity,
        transform: `translateY(${translateY}px) scale(${0.85 + opacity * 0.15})`,
        pointerEvents: opacity > 0.1 ? 'auto' : 'none'
      }}
    >
      <Button
        onClick={scrollToTop}
        className="h-9 w-9 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/35 backdrop-blur-sm border border-primary/30"
        size="icon"
        aria-label="Scroll to top of modal"
      >
        <ChevronUp 
          className="h-4 w-4 transition-transform duration-200" 
          style={{
            transform: `translateY(${-opacity * 0.5}px)`
          }}
        />
      </Button>
    </div>
  );
};

export default ModalScrollToTop;