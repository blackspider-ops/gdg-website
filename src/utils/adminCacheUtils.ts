import { cacheService } from '../services/cacheService';
import { clearContentCache, clearSpecificCache } from './serviceWorker';

export interface CacheInvalidationOptions {
  clearServiceWorkerCache?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  forceReload?: boolean;
  delay?: number;
}

/**
 * Comprehensive cache invalidation for admin content updates
 */
export async function invalidateContentCache(
  contentType?: string,
  options: CacheInvalidationOptions = {}
) {
  const {
    clearServiceWorkerCache = true,
    clearLocalStorage = true,
    clearSessionStorage = true,
    forceReload = true,
    delay = 100
  } = options;

  try {
    // Clear application-level caches
    if (contentType) {
      cacheService.clearContentType(contentType);
    } else {
      if (clearLocalStorage) cacheService.clear('localStorage');
      if (clearSessionStorage) cacheService.clear('sessionStorage');
      cacheService.clear('memory');
    }

    // Clear service worker cache
    if (clearServiceWorkerCache) {
      if (contentType) {
        await clearSpecificCache(contentType);
      } else {
        await clearContentCache();
      }
    }

    // Force reload after a short delay to ensure caches are cleared
    if (forceReload) {
      setTimeout(() => {
        window.location.reload();
      }, delay);
    }

    return true;
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
    return false;
  }
}

/**
 * Specific cache invalidation functions for different content types
 */
export const cacheInvalidators = {
  events: () => invalidateContentCache('events'),
  team: () => invalidateContentCache('team'),
  projects: () => invalidateContentCache('projects'),
  content: () => invalidateContentCache('content'),
  sponsors: () => invalidateContentCache('sponsors'),
  resources: () => invalidateContentCache('resources'),
  all: () => invalidateContentCache()
};

/**
 * Decorator function to automatically invalidate cache after admin operations
 */
export function withCacheInvalidation<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  contentType?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args);
      
      // Only invalidate cache if the operation was successful
      if (result && (result.success !== false)) {
        await invalidateContentCache(contentType, { forceReload: false });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }) as T;
}

/**
 * Hook-like function for React components to get cache invalidation functions
 */
export function createCacheInvalidator(contentType?: string) {
  return {
    invalidate: () => invalidateContentCache(contentType),
    invalidateWithoutReload: () => invalidateContentCache(contentType, { forceReload: false }),
    forceRefresh: () => {
      cacheService.forceRefresh();
      window.location.reload();
    }
  };
}