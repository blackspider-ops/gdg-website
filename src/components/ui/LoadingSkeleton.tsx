import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'event' | 'team';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className, 
  variant = 'text',
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        );
      
      case 'event':
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-muted"></div>
            <div className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-20"></div>
              </div>
            </div>
          </div>
        );
      
      case 'team':
        return (
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4 animate-pulse">
            <div className="w-24 h-24 bg-muted rounded-full mx-auto"></div>
            <div className="h-5 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        );
      
      case 'avatar':
        return (
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
        );
      
      case 'button':
        return (
          <div className="h-10 bg-muted rounded px-4 py-2 animate-pulse w-24"></div>
        );
      
      case 'text':
      default:
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        );
    }
  };

  if (count === 1) {
    return <div className={cn(className)}>{renderSkeleton()}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;