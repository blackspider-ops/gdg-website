/**
 * Simple cache invalidation utilities
 */

let cacheInvalidationTimeout: NodeJS.Timeout | null = null;

export function debouncedCacheInvalidation(
  invalidationFn: () => void,
  delay: number = 1000
) {
  if (cacheInvalidationTimeout) {
    clearTimeout(cacheInvalidationTimeout);
  }
  
  cacheInvalidationTimeout = setTimeout(() => {
    invalidationFn();
    cacheInvalidationTimeout = null;
  }, delay);
}