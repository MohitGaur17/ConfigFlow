const CACHE_NAME = "configflow-v2";
const RUNTIME_CACHE = "configflow-runtime-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/offline",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// Install: Cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[SW] Cache addAll warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip SSE notification stream requests
  if (url.pathname.includes("/notifications/stream")) {
    return;
  }

  // API requests: Network first with cached fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              new Response(
                JSON.stringify({
                  success: false,
                  error: "Offline: Network connection unavailable",
                  offline: true,
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              )
            );
          });
        })
    );
    return;
  }

  // Navigation requests: Network first, fallback to cached page or /offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match("/offline.html").then((offlineRes) => {
              return (
                offlineRes ||
                new Response("You are currently offline.", {
                  status: 503,
                  headers: { "Content-Type": "text/plain" },
                })
              );
            });
          });
        })
    );
    return;
  }

  // Static assets (styles, scripts, images): Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          if (request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1e293b" width="100" height="100"/></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Handle messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
