const CACHE_NAME = "thiscord-shell-v5";
const SCOPE = new URL(self.registration.scope);
const scopedPath = (name = "") => new URL(name, SCOPE).pathname;
const SHELL = [
  scopedPath(),
  scopedPath("manifest.webmanifest"),
  scopedPath("favicon.svg"),
  scopedPath("icon-192.png"),
  scopedPath("icon-512.png"),
  scopedPath("distribution.json"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET"
    || url.origin !== self.location.origin
    || url.pathname.startsWith(scopedPath("src/"))
    || url.pathname.startsWith(scopedPath("@"))
    || url.pathname.startsWith(scopedPath("node_modules/"))
    || url.pathname === scopedPath("sw.js")
    || url.pathname === scopedPath("distribution.json")
  ) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(scopedPath(), copy));
          return response;
        })
        .catch(() => caches.match(scopedPath())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
