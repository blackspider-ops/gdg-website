import React, { useEffect } from 'react';
import { OptimizedContentService } from '@/services/optimizedContentService';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {

  // Preload critical resources on idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idleCallback = (window as any).requestIdleCallback(() => {
        // Preload next likely pages
        OptimizedContentService.preloadContent(['events', 'team', 'projects']);
      });

      return () => {
        (window as any).cancelIdleCallback(idleCallback);
      };
    }
  }, []);

  return (
    <>
      {children}
      

    </>
  );
};

export default PerformanceOptimizer;