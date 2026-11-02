/* ==========================================================================
   Service worker for the Babatunde Ayoola Awoyemi site.

   This site shares one web address (babatundeawo.github.io) with many other
   projects, each in its own folder (for example /globalwarming/). This worker
   therefore only ever touches the files that belong to THIS site and leaves
   every other request alone.

   What it does
   - Saves the pages, styles, scripts and fonts of this site on the device
     ("precache"), under a name that includes a build id, so the saved set is
     always one consistent version.
   - Opens saved pages instantly, even with no connection.
   - Saves images the first time they are shown ("runtime cache").
   - Shows a friendly offline page when the visitor is offline and opens a page
     that is not saved (for example a project link).
   - Never replaces a running version by itself. A new version waits until the
     visitor taps "Refresh" in the page (or closes every tab of the site).

   scripts/build.mjs fills in BUILD_ID and PRECACHE_URLS on every deploy. The
   values below also work as they are when the files are served from the source
   folder.
   ========================================================================== */
"use strict";

const BUILD_ID = "dev"; // @build-id
const PRECACHE_URLS = [
  "index.html",
  "projects.html",
  "offline.html",
  "css/style.css",
  "js/main.js",
  "js/pwa.js",
  "manifest.webmanifest",
  "assets/fonts/fraunces-latin-600.woff2",
  "assets/fonts/inter-latin-regular.woff2",
  "assets/fonts/inter-latin-medium.woff2",
  "assets/fonts/inter-latin-semibold.woff2",
  "assets/icons/favicon.svg",
  "assets/icons/icon-192.png",
]; // @precache

/* Every cache this worker creates starts with this prefix. Other projects on
   the same web address keep their own caches, and we never touch those. */
const PREFIX = "ba-";
const SHELL_CACHE = PREFIX + "shell-" + BUILD_ID;
const RUNTIME_CACHE = PREFIX + "runtime-v1";
const RUNTIME_LIMIT = 60;

const SCOPE = self.registration.scope; // e.g. https://babatundeawo.github.io/
const BASE_PATH = new URL(SCOPE).pathname; // e.g. /

const inScope = (path) => new URL(path, SCOPE).href;

/* Pages that belong to this site, keyed by their path inside the scope. */
const PAGES = new Map([
  ["", "index.html"],
  ["index.html", "index.html"],
  ["projects", "projects.html"],
  ["projects.html", "projects.html"],
  ["offline.html", "offline.html"],
]);

/* Folders and files that belong to this site. */
const isOwnedAsset = (rel) =>
  rel.startsWith("css/") ||
  rel.startsWith("js/") ||
  rel.startsWith("assets/") ||
  rel === "manifest.webmanifest" ||
  rel === "favicon.ico";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // "reload" skips the browser's own HTTP cache so a fresh copy is saved.
      cache.addAll(PRECACHE_URLS.map((url) => new Request(inScope(url), { cache: "reload" })))
    )
  );
  // No skipWaiting() here on purpose: the page decides when to switch.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith(PREFIX) && !keep.has(name)).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE_PATH)) return;
  const rel = url.pathname.slice(BASE_PATH.length);

  if (request.mode === "navigate") {
    const page = PAGES.get(rel);
    if (page) {
      event.respondWith(openSavedPage(page));
    } else if (self.navigator.onLine === false) {
      // Another project on this web address, opened while offline.
      event.respondWith(offlinePage());
    }
    // Online and not ours: do nothing, the browser loads it as usual.
    return;
  }

  if (isOwnedAsset(rel)) event.respondWith(savedAsset(request));
});

async function openSavedPage(page) {
  const cache = await caches.open(SHELL_CACHE);
  const saved = await cache.match(inScope(page));
  return saved || offlinePage();
}

async function offlinePage() {
  const cache = await caches.open(SHELL_CACHE);
  const saved = await cache.match(inScope("offline.html"));
  return saved || Response.error();
}

async function savedAsset(request) {
  const shell = await caches.open(SHELL_CACHE);
  const fromShell = await shell.match(request, { ignoreSearch: true });
  if (fromShell) return fromShell;

  const runtime = await caches.open(RUNTIME_CACHE);
  const fromRuntime = await runtime.match(request);
  if (fromRuntime) return fromRuntime;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await runtime.put(request, response.clone());
    await trim(runtime, RUNTIME_LIMIT);
  }
  return response;
}

/* Keep the runtime cache small: drop the oldest entries first. */
async function trim(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i += 1) await cache.delete(keys[i]);
}
