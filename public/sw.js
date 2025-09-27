// Service Worker for caching and performance optimization
const CACHE_NAME = 'gdg-website-v2';
const STATIC_CACHE_NAME = 'gdg-static-v2';
const DYNAMIC_CACHE_NAME = 'gdg-dynamic-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/gdg-logo.png'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  /\/api\/content\//,
  /\/api\/events\//,
  /\/api\/team\//,
  /\/api\/projects\//
];

// Admin-managed content that should have shorter cache times
const ADMIN_CONTENT_PATTERNS = [
  /\/api\/content\//,
  /\/api\/events\//,
  /\/api\/team\//,
  /\/api\/projects\//,
  /supabase.*\/rest\/v1\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAdminContent(request)) {
    // Use network-first for admin-managed content to ensure freshness
    event.respondWith(networkFirstWithShortCache(request, DYNAMIC_CACHE_NAME));
  } else if (isAPIRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if available, otherwise return offline page
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse;
  });

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

async function networkFirstWithShortCache(request, cacheName) {
  try {
    // Always try network first for admin content
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Add timestamp to track cache age
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      cache.put(request, responseWithTimestamp.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Check if we have a cached version that's not too old (5 minutes max)
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (cachedAt && parseInt(cachedAt) > fiveMinutesAgo) {
        return cachedResponse;
      } else {
        // Cache is too old, remove it
        cache.delete(request);
      }
    }
    
    return new Response('Content unavailable', { status: 503 });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('supabase');
}

function isAdminContent(request) {
  const url = new URL(request.url);
  return ADMIN_CONTENT_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('supabase');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued offline actions
  // This could include form submissions, analytics, etc.
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message handling for cache invalidation
self.addEventListener('message', (event) => {
  const { type, pattern } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CLEAR_ADMIN_CONTENT_CACHE') {
    event.waitUntil(clearAdminContentCache());
  } else if (type === 'CLEAR_SPECIFIC_CACHE') {
    event.waitUntil(clearSpecificCachePattern(pattern));
  }
});

async function clearAdminContentCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    const adminContentRequests = requests.filter(request => {
      return ADMIN_CONTENT_PATTERNS.some(pattern => 
        pattern.test(new URL(request.url).pathname)
      ) || new URL(request.url).hostname.includes('supabase');
    });
    
    await Promise.all(
      adminContentRequests.map(request => cache.delete(request))
    );
    
    // Notify all clients that cache has been cleared
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'CACHE_CLEARED' });
    });
  } catch (error) {
    console.error('Failed to clear admin content cache:', error);
  }
}

async function clearSpecificCachePattern(pattern) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    const matchingRequests = requests.filter(request => {
      const url = new URL(request.url);
      return url.pathname.includes(pattern) || url.href.includes(pattern);
    });
    
    await Promise.all(
      matchingRequests.map(request => cache.delete(request))
    );
  } catch (error) {
    console.error('Failed to clear specific cache pattern:', error);
  }
}