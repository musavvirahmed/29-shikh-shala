const CACHE = "twenty-nine-govuk-21";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/govuk-frontend.min.css",
  "./css/table.css",
  "./copy/bengali.md",
  "./assets/logo.svg",
  "./assets/fonts/source-sans-3-latin-400-normal.woff2",
  "./assets/fonts/source-sans-3-latin-700-normal.woff2",
  "./js/i18n.js",
  "./js/engine.js",
  "./js/bots.js",
  "./js/lessons.js",
  "./js/ui.js",
  "./js/rules.js",
  "./js/main.js",
  "./assets/tiles/Felt_Green.png",
  "./icons/favicon.svg",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/cards/01c.gif",
  "./assets/cards/01d.gif",
  "./assets/cards/01h.gif",
  "./assets/cards/01s.gif",
  "./assets/cards/07c.gif",
  "./assets/cards/07d.gif",
  "./assets/cards/07h.gif",
  "./assets/cards/07s.gif",
  "./assets/cards/08c.gif",
  "./assets/cards/08d.gif",
  "./assets/cards/08h.gif",
  "./assets/cards/08s.gif",
  "./assets/cards/09c.gif",
  "./assets/cards/09d.gif",
  "./assets/cards/09h.gif",
  "./assets/cards/09s.gif",
  "./assets/cards/10c.gif",
  "./assets/cards/10d.gif",
  "./assets/cards/10h.gif",
  "./assets/cards/10s.gif",
  "./assets/cards/11c.gif",
  "./assets/cards/11d.gif",
  "./assets/cards/11h.gif",
  "./assets/cards/11s.gif",
  "./assets/cards/12c.gif",
  "./assets/cards/12d.gif",
  "./assets/cards/12h.gif",
  "./assets/cards/12s.gif",
  "./assets/cards/13c.gif",
  "./assets/cards/13d.gif",
  "./assets/cards/13h.gif",
  "./assets/cards/13s.gif",
  "./assets/cards/back111.gif",
];

function isShell(url) {
  const path = new URL(url).pathname;
  return (
    path.endsWith(".css") ||
    path.endsWith(".js") ||
    path.endsWith(".html") ||
    path.endsWith("/") ||
    path.endsWith("manifest.webmanifest")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // CSS/JS/HTML: network first so shadow/style fixes are not stuck on an old cache.
  if (isShell(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
