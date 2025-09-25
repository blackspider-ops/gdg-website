import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useConnectionAwareLoading } from '@/hooks/useLoadingOptimization';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'event' | 'team' | 'project';
  count?: number;
  animated?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = memo(({ 
  className, 
  variant = 'text',
  count = 1,
  animated = true
}) => {
  const { shouldLoadHighQuality } = useConnectionAwareLoading();
  
  // Reduce animation on slow connections
  const animationClass = animated && shouldLoadHighQuality() ? 'animate-pulse' : '';
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-card border border-border rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 ${animationClass}`}>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        );
      
      case 'event':
        return (
          <div className={`bg-card border border-border rounded-lg overflow-hidden ${animationClass}`}>
            <div className="h-32 sm:h-48 bg-muted"></div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-muted rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-muted rounded w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 sm:h-4 bg-muted rounded w-1/3"></div>
                <div className="h-6 sm:h-8 bg-muted rounded w-16 sm:w-20"></div>
              </div>
            </div>
          </div>
        );
      
      case 'team':
        return (
          <div className={`bg-card border border-border rounded-lg p-4 sm:p-6 text-center space-y-3 sm:space-y-4 ${animationClass}`}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 sm:h-5 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-3 sm:h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        );
      
      case 'project':
        return (
          <div className={`bg-card border border-border rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 ${animationClass}`}>
            <div className="h-32 sm:h-48 bg-muted rounded-lg"></div>
            <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-muted rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-muted rounded w-5/6"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-5 sm:h-6 bg-muted rounded-full w-12 sm:w-16"></div>
              <div className="h-5 sm:h-6 bg-muted rounded-full w-16 sm:w-20"></div>
              <div className="h-5 sm:h-6 bg-muted rounded-full w-10 sm:w-14"></div>
            </div>
          </div>
        );
      
      case 'avatar':
        return (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full ${animationClass}`}></div>
        );
      
      case 'button':
        return (
          <div className={`h-8 sm:h-10 bg-muted rounded px-3 sm:px-4 py-2 w-20 sm:w-24 ${animationClass}`}></div>
        );
      
      case 'text':
      default:
        return (
          <div className={`space-y-2 ${animationClass}`}>
            <div className="h-3 sm:h-4 bg-muted rounded w-full"></div>
            <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
          </div>
        );
    }
  };

  if (count === 1) {
    return <div className={cn(className)}>{renderSkeleton()}</div>;
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;