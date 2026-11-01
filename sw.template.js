/* Service worker. The build fills in the version and the file list below.
   - App shell: stored on install, served cache-first.
   - Pages: network first, falling back to the stored copy, then to offline.html.
   - Images: stored the first time they are used.
   A new version waits until the visitor taps "Refresh" in the update notice. */
const VERSION = "__VERSION__";
const SHELL = "shell-" + VERSION;
const IMAGES = "images-v1";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== IMAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok) caches.open(SHELL).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true })
            .then((hit) => hit || caches.match(url.pathname.endsWith("/") ? "./" : request.url.split("#")[0]))
            .then((hit) => hit || caches.match("offline.html"))
        )
    );
    return;
  }

  if (/\.(?:avif|webp|jpe?g|png|svg)$/i.test(url.pathname) && url.pathname.includes("/assets/images/")) {
    event.respondWith(
      caches.open(IMAGES).then((cache) =>
        cache.match(request).then((hit) =>
          hit || fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(SHELL).then((cache) => cache.put(request, copy)); }
      return response;
    }))
  );
});
