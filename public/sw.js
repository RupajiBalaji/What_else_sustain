/**
 * Service Worker for What Else Sustain
 * Caches 3D assets (.glb, draco decoder), icons, and static assets
 * for offline access and instant second-load performance.
 */

const CACHE_NAME = 'wes-cache-v3'
const ASSET_PATTERNS_CACHE_FIRST = [
  /\/models\//,
  /\/draco\//,
  /\/icons\//,
  /\.(?:glb|gltf|bin|wasm|woff2|woff|ttf|png|jpg|jpeg|svg|webp)$/i
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Do not intercept non-GET requests or backend simulation API calls
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return
  }

  // 1. HTML Navigation Requests: NETWORK FIRST
  // Always fetch the freshest index.html from server so new releases are immediately seen.
  // Falls back to cached offline shell only when disconnected.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return networkResponse
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // 2. Heavy 3D models & binary assets: CACHE FIRST
  const isCacheFirst = ASSET_PATTERNS_CACHE_FIRST.some((pattern) => pattern.test(url.pathname))

  if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return networkResponse
        }).catch(() => {
          return new Response(null, { status: 404 })
        })
      })
    )
  } else {
    // 3. Stale-while-revalidate for hashed script & style assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return networkResponse
        }).catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
  }
})
