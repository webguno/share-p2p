const CACHE_NAME = 'p2p-file-share-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/main.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('Service Worker: Cache failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, return offline page
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background sync for pending file transfers (if supported)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-file-transfer') {
        event.waitUntil(
            // Handle background file transfer logic
            handleBackgroundSync()
        );
    }
});

// Handle background sync
async function handleBackgroundSync() {
    try {
        // Check for pending transfers in IndexedDB or localStorage
        const pendingTransfers = await getPendingTransfers();
        
        for (const transfer of pendingTransfers) {
            // Attempt to resume or retry transfer
            await resumeTransfer(transfer);
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

// Get pending transfers (placeholder implementation)
async function getPendingTransfers() {
    // In a real implementation, this would check IndexedDB
    // for any interrupted file transfers
    return [];
}

// Resume transfer (placeholder implementation)
async function resumeTransfer(transfer) {
    // In a real implementation, this would attempt to
    // reconnect and resume the file transfer
    console.log('Resuming transfer:', transfer);
}

// Push notification support for connection requests
self.addEventListener('push', (event) => {
    const options = {
        body: 'New file transfer request received',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'file-transfer',
        requireInteraction: true,
        actions: [
            {
                action: 'accept',
                title: 'Accept',
                icon: '/accept-icon.png'
            },
            {
                action: 'decline',
                title: 'Decline',
                icon: '/decline-icon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('P2P File Share', options)
    );
});

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'accept') {
        // Open the app and accept the transfer
        event.waitUntil(
            clients.openWindow('/?action=accept')
        );
    } else if (event.action === 'decline') {
        // Handle decline action
        event.waitUntil(
            handleDecline()
        );
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle decline action
async function handleDecline() {
    // Send decline message to connected peers
    console.log('File transfer declined');
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'CACHE_FILE':
            // Cache a specific file for offline access
            cacheFile(data.url, data.name);
            break;
        case 'CLEAR_CACHE':
            // Clear specific cache entries
            clearCache(data.pattern);
            break;
        case 'GET_CACHE_STATUS':
            // Get cache status
            getCacheStatus().then(status => {
                event.ports[0].postMessage({ type: 'CACHE_STATUS', data: status });
            });
            break;
    }
});

// Cache a specific file
async function cacheFile(url, name) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(url);
        console.log('File cached:', name);
    } catch (error) {
        console.log('Failed to cache file:', error);
    }
}

// Clear cache entries matching pattern
async function clearCache(pattern) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        const keysToDelete = keys.filter(key => key.url.includes(pattern));
        
        await Promise.all(
            keysToDelete.map(key => cache.delete(key))
        );
        
        console.log('Cache cleared for pattern:', pattern);
    } catch (error) {
        console.log('Failed to clear cache:', error);
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        return {
            cacheSize: keys.length,
            cachedUrls: keys.map(key => key.url)
        };
    } catch (error) {
        console.log('Failed to get cache status:', error);
        return { cacheSize: 0, cachedUrls: [] };
    }
}

// Network status monitoring
self.addEventListener('online', () => {
    console.log('Network: Online');
    // Notify main thread about network status
    broadcastNetworkStatus(true);
});

self.addEventListener('offline', () => {
    console.log('Network: Offline');
    // Notify main thread about network status
    broadcastNetworkStatus(false);
});

// Broadcast network status to all clients
async function broadcastNetworkStatus(isOnline) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'NETWORK_STATUS',
            data: { isOnline }
        });
    });
}

// Periodic cleanup of old signaling data
setInterval(() => {
    cleanupOldSignalingData();
}, 5 * 60 * 1000); // Every 5 minutes

async function cleanupOldSignalingData() {
    // This would clean up old WebRTC signaling data from localStorage
    // to prevent memory leaks from abandoned connections
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CLEANUP_SIGNALING',
                data: { timestamp: Date.now() }
            });
        });
    } catch (error) {
        console.log('Cleanup failed:', error);
    }
}
