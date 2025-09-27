// Advanced caching service for performance optimization
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

export interface CacheConfig {
  ttl: number;
  version: string;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheService {
  private memoryCache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_VERSION = '1.0.0';

  // Default cache configurations for different data types
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    siteSettings: { ttl: 30 * 60 * 1000, version: this.CACHE_VERSION, storage: 'localStorage' }, // 30 minutes
    navigationItems: { ttl: 30 * 60 * 1000, version: this.CACHE_VERSION, storage: 'localStorage' }, // 30 minutes
    footerContent: { ttl: 30 * 60 * 1000, version: this.CACHE_VERSION, storage: 'localStorage' }, // 30 minutes
    pageContent: { ttl: 15 * 60 * 1000, version: this.CACHE_VERSION, storage: 'sessionStorage' }, // 15 minutes
    events: { ttl: 2 * 60 * 1000, version: this.CACHE_VERSION, storage: 'memory' }, // 2 minutes (frequently updated)
    teamMembers: { ttl: 10 * 60 * 1000, version: this.CACHE_VERSION, storage: 'sessionStorage' }, // 10 minutes
    projects: { ttl: 10 * 60 * 1000, version: this.CACHE_VERSION, storage: 'sessionStorage' }, // 10 minutes
    sponsors: { ttl: 60 * 60 * 1000, version: this.CACHE_VERSION, storage: 'localStorage' }, // 1 hour
    resources: { ttl: 30 * 60 * 1000, version: this.CACHE_VERSION, storage: 'sessionStorage' }, // 30 minutes
  };

  private getStorage(storageType: 'memory' | 'localStorage' | 'sessionStorage') {
    switch (storageType) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : null;
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : null;
      case 'memory':
      default:
        return null; // Use memory cache
    }
  }

  private generateKey(prefix: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `gdg_cache_${prefix}_${btoa(paramString).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.cacheConfigs[key.split('_')[0]] || {}, ...config };
    const ttl = finalConfig.ttl || this.DEFAULT_TTL;
    const version = finalConfig.version || this.CACHE_VERSION;
    const storage = finalConfig.storage || 'memory';

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version,
    };

    const storageEngine = this.getStorage(storage);
    
    if (storageEngine) {
      try {
        storageEngine.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        // Storage full or unavailable, fallback to memory
        this.memoryCache.set(key, cacheItem);
      }
    } else {
      this.memoryCache.set(key, cacheItem);
    }
  }

  get<T>(key: string, config?: Partial<CacheConfig>): T | null {
    const finalConfig = { ...this.cacheConfigs[key.split('_')[0]] || {}, ...config };
    const storage = finalConfig.storage || 'memory';
    const storageEngine = this.getStorage(storage);

    let cacheItem: CacheItem<T> | null = null;

    // Try to get from appropriate storage
    if (storageEngine) {
      try {
        const stored = storageEngine.getItem(key);
        if (stored) {
          cacheItem = JSON.parse(stored);
        }
      } catch (error) {
        // Invalid JSON or storage error, remove the item
        storageEngine.removeItem(key);
      }
    } else {
      cacheItem = this.memoryCache.get(key) || null;
    }

    if (!cacheItem) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cacheItem.timestamp > cacheItem.ttl) {
      this.delete(key, config);
      return null;
    }

    // Check version compatibility
    if (cacheItem.version !== (finalConfig.version || this.CACHE_VERSION)) {
      this.delete(key, config);
      return null;
    }

    return cacheItem.data;
  }

  delete(key: string, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.cacheConfigs[key.split('_')[0]] || {}, ...config };
    const storage = finalConfig.storage || 'memory';
    const storageEngine = this.getStorage(storage);

    if (storageEngine) {
      storageEngine.removeItem(key);
    } else {
      this.memoryCache.delete(key);
    }
  }

  clear(storageType?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storageType || storageType === 'memory') {
      this.memoryCache.clear();
    }

    if (!storageType || storageType === 'localStorage') {
      const localStorage = this.getStorage('localStorage');
      if (localStorage) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('gdg_cache_'));
        keys.forEach(key => localStorage.removeItem(key));
      }
    }

    if (!storageType || storageType === 'sessionStorage') {
      const sessionStorage = this.getStorage('sessionStorage');
      if (sessionStorage) {
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('gdg_cache_'));
        keys.forEach(key => sessionStorage.removeItem(key));
      }
    }
  }

  // Clear cache for specific content types (for admin updates)
  clearContentType(contentType: string): void {
    // Clear from all storage types
    ['memory', 'localStorage', 'sessionStorage'].forEach(storageType => {
      if (storageType === 'memory') {
        const keysToDelete = Array.from(this.memoryCache.keys()).filter(key => 
          key.includes(contentType)
        );
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      } else {
        const storage = this.getStorage(storageType as any);
        if (storage) {
          const keys = Object.keys(storage).filter(key => 
            key.startsWith('gdg_cache_') && key.includes(contentType)
          );
          keys.forEach(key => storage.removeItem(key));
        }
      }
    });
  }

  // Force refresh by clearing all caches and adding timestamp
  forceRefresh(): void {
    this.clear();
    // Also clear service worker cache if available
    if ('serviceWorker' in navigator && 'caches' in window) {
      import('../utils/serviceWorker').then(({ clearContentCache }) => {
        clearContentCache();
      });
    }
  }

  // Preload data in the background
  async preload<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<void> {
    // Check if we already have fresh data
    const cached = this.get<T>(key, config);
    if (cached) return;

    try {
      const data = await fetchFunction();
      this.set(key, data, config);
    } catch (error) {
      // Silently fail preloading
    }
  }

  // Get data with automatic fetching and caching
  async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key, config);
    if (cached) return cached;

    // Fetch fresh data
    const data = await fetchFunction();
    this.set(key, data, config);
    return data;
  }

  // Batch operations for multiple cache items
  setBatch<T>(items: Array<{ key: string; data: T; config?: Partial<CacheConfig> }>): void {
    items.forEach(({ key, data, config }) => {
      this.set(key, data, config);
    });
  }

  getBatch<T>(keys: Array<{ key: string; config?: Partial<CacheConfig> }>): Array<T | null> {
    return keys.map(({ key, config }) => this.get<T>(key, config));
  }



  // Cleanup expired items
  cleanup(): void {
    // Cleanup memory cache
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    try {
      const localStorage = this.getStorage('localStorage');
      if (localStorage) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('gdg_cache_'));
        keys.forEach(key => {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '');
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      // Storage not available
    }

    // Cleanup sessionStorage
    try {
      const sessionStorage = this.getStorage('sessionStorage');
      if (sessionStorage) {
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('gdg_cache_'));
        keys.forEach(key => {
          try {
            const item = JSON.parse(sessionStorage.getItem(key) || '');
            if (now - item.timestamp > item.ttl) {
              sessionStorage.removeItem(key);
            }
          } catch (error) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      // Storage not available
    }
  }
}

export const cacheService = new CacheService();

// Cleanup expired cache items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.cleanup();
  }, 5 * 60 * 1000);
}