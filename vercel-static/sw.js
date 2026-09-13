/* Arman Hair Studio — service worker
 * Minimal offline-capable PWA shell. Cache-first for static assets,
 * network-first for API and pages.
 */
const CACHE = "arman-v3";
const STATIC = [
  "/",
  "/manifest.json",
  "/assets/arman-logo.png",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache API calls or auth
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for HTML documents
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/") || new Response("Offline", { status: 200, headers: { "Content-Type": "text/html" } }))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE).then((c) => c.put(req, resClone)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
