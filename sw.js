// PMATH EDUCATION TOOLS — Service Worker (Offline & Cache Optimization v2.5)
const CACHE_NAME = "pmath-cache-v2.5";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./equations.js",
  "./auth.js",
  "./favicon.png",
  "./pmath-logo.png",
  "./manifest.json",
  "./assets/index-B5VXrJpN.css",
  "./assets/index-Cfxrtuua.js",
  "./assets/AxMath-Regular-BJ-pkwBB.ttf",
  "./assets/AxMath-Bold-BrMN_prG.ttf",
  "./assets/AxMath-Italic-0cLRlryO.ttf",
  "./assets/AxMath-BoldItalic-D1qX9GvX.ttf"
];

// Install Event: Pre-cache core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching PMATH static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[ServiceWorker] Some assets could not be pre-cached:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache First for static fonts & assets, Network First for document
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests like Google Identity API or external CDNs
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle local requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, and update cache in background (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Fetch from network if not in cache
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML page, return index.html
          if (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html")) {
            return caches.match("./index.html");
          }
        });
    })
  );
});
