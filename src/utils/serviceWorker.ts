// Service Worker registration and management
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          // Service worker is ready for offline use
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for offline use
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      // Error during service worker registration
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      // No internet connection found. App is running in offline mode.
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        // Error unregistering service worker
      });
  }
}

// Update service worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// Check if service worker is supported and register
export function initServiceWorker() {
  if (process.env.NODE_ENV === 'production') {
    register({
      onSuccess: () => {
        // App is ready for offline use
      },
      onUpdate: (registration) => {
        // New version available - could show update notification to user
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    });
  }
}

// Cache invalidation functions
export async function clearContentCache() {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const dynamicCaches = cacheNames.filter(name => 
        name.includes('dynamic') || name.includes('gdg-website')
      );
      
      await Promise.all(
        dynamicCaches.map(cacheName => caches.delete(cacheName))
      );
      
      // Also send message to service worker to clear specific patterns
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEAR_ADMIN_CONTENT_CACHE'
        });
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

export async function clearSpecificCache(pattern: string) {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEAR_SPECIFIC_CACHE',
          pattern: pattern
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

// Force refresh content by adding cache-busting parameter
export function forceRefreshContent() {
  const timestamp = Date.now();
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('_refresh', timestamp.toString());
  window.history.replaceState({}, '', currentUrl.toString());
  window.location.reload();
}