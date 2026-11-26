// Service worker (production only) for fishing on the rocks without signal:
// - pages, app files, /api/species and /api/pin: network first, the last good answer from the cache when offline;
// - fish photos (Wikimedia): cache first, so the guide shows pictures offline;
// - map tiles and POST requests (My catch) always go to the network.
const CACHE = "ribolov-v2";
const IMAGES = "ribolov-img-v1";
const OFFLINE_API = ["/api/species", "/api/pin"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.webmanifest", "/icon.svg"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== IMAGES).map((k) => caches.delete(k)))));
  self.clients.claim();
});

function networkFirst(req, fallbackToHome) {
  return fetch(req)
    .then((r) => {
      if (r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return r;
    })
    .catch(() =>
      caches.match(req).then((r) => {
        if (!r) return fallbackToHome ? caches.match("/") : Response.error();
        // mark answers served from the cache, so the app can say it is offline
        const h = new Headers(r.headers);
        h.set("X-Ribolov-Offline", "1");
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }),
    );
}

function cacheFirstImage(req) {
  return caches.open(IMAGES).then((c) =>
    c.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((r) => {
          if (r.ok || r.type === "opaque") {
            c.put(req, r.clone());
            // keep the image cache small
            c.keys().then((ks) => ks.length > 150 && c.delete(ks[0]));
          }
          return r;
        }),
    ),
  );
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.hostname.endsWith("wikimedia.org")) return e.respondWith(cacheFirstImage(e.request));
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    if (OFFLINE_API.includes(url.pathname)) e.respondWith(networkFirst(e.request, false));
    return;
  }
  e.respondWith(networkFirst(e.request, e.request.mode === "navigate"));
});
