import { useCallback } from 'react';
import { clearContentCache, clearSpecificCache, forceRefreshContent } from '../utils/serviceWorker';

export function useCacheInvalidation() {
  const clearAllContentCache = useCallback(async () => {
    const success = await clearContentCache();
    if (success) {
      // Small delay to ensure cache is cleared before refresh
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    return success;
  }, []);

  const clearCacheForPattern = useCallback(async (pattern: string) => {
    const success = await clearSpecificCache(pattern);
    if (success) {
      // Small delay to ensure cache is cleared
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    return success;
  }, []);

  const forceRefresh = useCallback(() => {
    forceRefreshContent();
  }, []);

  // Specific cache clearing functions for different content types
  const clearEventsCache = useCallback(() => clearCacheForPattern('/api/events'), [clearCacheForPattern]);
  const clearTeamCache = useCallback(() => clearCacheForPattern('/api/team'), [clearCacheForPattern]);
  const clearProjectsCache = useCallback(() => clearCacheForPattern('/api/projects'), [clearCacheForPattern]);
  const clearContentCache = useCallback(() => clearCacheForPattern('/api/content'), [clearCacheForPattern]);

  return {
    clearAllContentCache,
    clearCacheForPattern,
    forceRefresh,
    clearEventsCache,
    clearTeamCache,
    clearProjectsCache,
    clearContentCache
  };
}