import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { invalidateContentCache, cacheInvalidators } from '@/utils/adminCacheUtils';

interface CacheClearButtonProps {
  contentType?: 'events' | 'team' | 'projects' | 'content' | 'sponsors' | 'resources' | 'all';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export function CacheClearButton({
  contentType = 'all',
  variant = 'outline',
  size = 'sm',
  showText = true,
  className = ''
}: CacheClearButtonProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      if (contentType === 'all') {
        await cacheInvalidators.all();
      } else {
        await cacheInvalidators[contentType]();
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsClearing(false);
    }
  };

  const getButtonText = () => {
    if (!showText) return '';
    
    if (isClearing) return 'Clearing...';
    
    switch (contentType) {
      case 'events': return 'Clear Events Cache';
      case 'team': return 'Clear Team Cache';
      case 'projects': return 'Clear Projects Cache';
      case 'content': return 'Clear Content Cache';
      case 'sponsors': return 'Clear Sponsors Cache';
      case 'resources': return 'Clear Resources Cache';
      default: return 'Clear All Cache';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearCache}
      disabled={isClearing}
      className={`${className} ${isClearing ? 'opacity-50' : ''}`}
      title={`Clear ${contentType} cache and refresh content`}
    >
      {isClearing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {getButtonText()}
        </span>
      )}
    </Button>
  );
}

// Quick access buttons for different content types
export const EventsCacheClearButton = (props: Omit<CacheClearButtonProps, 'contentType'>) => (
  <CacheClearButton {...props} contentType="events" />
);

export const TeamCacheClearButton = (props: Omit<CacheClearButtonProps, 'contentType'>) => (
  <CacheClearButton {...props} contentType="team" />
);

export const ProjectsCacheClearButton = (props: Omit<CacheClearButtonProps, 'contentType'>) => (
  <CacheClearButton {...props} contentType="projects" />
);

export const ContentCacheClearButton = (props: Omit<CacheClearButtonProps, 'contentType'>) => (
  <CacheClearButton {...props} contentType="content" />
);

export const AllCacheClearButton = (props: Omit<CacheClearButtonProps, 'contentType'>) => (
  <CacheClearButton {...props} contentType="all" />
);