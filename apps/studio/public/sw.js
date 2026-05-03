// AIX Studio Service Worker - Pet Mini Apps Background Engine
// Enables offline capability, background sync, and push notifications

const CACHE_VERSION = 'aix-studio-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const PET_DATA_CACHE = `${CACHE_VERSION}-pet-data`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('aix-studio-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== PET_DATA_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  // API requests - network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(JSON.stringify({ error: 'Offline', cached: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Pet data - cache-first for performance
  if (url.pathname.startsWith('/pets/') || url.pathname.includes('pet-data')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(PET_DATA_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Static assets - cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background Sync - for pet task execution
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag.startsWith('pet-task-')) {
    const petId = event.tag.replace('pet-task-', '');
    event.waitUntil(executePetTask(petId));
  }
  
  if (event.tag === 'sync-all-pets') {
    event.waitUntil(syncAllPets());
  }
});

// Push Notifications - for pet alerts
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = { title: 'AIX Studio', body: 'New notification' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'aix-notification',
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Periodic Background Sync - for autonomous pet execution
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'pet-autonomous-execution') {
    event.waitUntil(executeAutonomousPets());
  }
});

// Message handler - for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_PET_DATA') {
    event.waitUntil(
      caches.open(PET_DATA_CACHE).then((cache) => {
        return cache.put(event.data.url, new Response(JSON.stringify(event.data.data)));
      })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }
});

// Helper: Execute pet task in background
async function executePetTask(petId) {
  try {
    const response = await fetch(`/api/pets/${petId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[SW] Pet task executed:', petId, result);
      
      // Notify user if task completed
      if (result.completed) {
        await self.registration.showNotification('Pet Task Complete', {
          body: `${result.petName} completed: ${result.taskName}`,
          icon: '/icons/icon-192x192.png',
          tag: `pet-${petId}-complete`
        });
      }
    }
  } catch (error) {
    console.error('[SW] Pet task execution failed:', error);
  }
}

// Helper: Sync all pets
async function syncAllPets() {
  try {
    const response = await fetch('/api/pets/sync', { method: 'POST' });
    if (response.ok) {
      console.log('[SW] All pets synced successfully');
    }
  } catch (error) {
    console.error('[SW] Pet sync failed:', error);
  }
}

// Helper: Execute autonomous pets (periodic)
async function executeAutonomousPets() {
  try {
    const response = await fetch('/api/pets/autonomous-execute', { method: 'POST' });
    if (response.ok) {
      const results = await response.json();
      console.log('[SW] Autonomous pets executed:', results);
    }
  } catch (error) {
    console.error('[SW] Autonomous execution failed:', error);
  }
}

console.log('[SW] Service Worker loaded');

// Made with Moe Abdelaziz
