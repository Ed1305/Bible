// Lumina Bible service worker — offline-first caching.
const VERSION = "lumina-v3";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const ASSET_CACHE = `${VERSION}-assets`;
const BIBLE_PACK_CACHE = "lumina-bible-packs";

const SHELL_URLS = [
  "/",
  "/read",
  "/listen",
  "/today",
  "/search",
  "/prayers",
  "/journal",
  "/settings",
  "/manifest.webmanifest",
  "/offline.html",
  "/bible/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(SHELL_URLS.map((u) => cache.add(u))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION) && k !== BIBLE_PACK_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isReadRoute(url) {
  return url.pathname === "/read" || url.pathname.startsWith("/read/");
}

function isBiblePack(url) {
  return url.pathname.startsWith("/bible/");
}

async function matchShell(request, url) {
  const cachedExact = await caches.match(request);
  if (cachedExact) return cachedExact;
  if (isReadRoute(url)) {
    return (
      (await caches.match("/read")) ||
      (await caches.match("/")) ||
      (await caches.match("/offline.html"))
    );
  }
  return (
    (await caches.match(url.pathname)) ||
    (await caches.match("/")) ||
    (await caches.match("/offline.html"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache health checks.
  if (url.pathname === "/api/health") return;

  // Navigations: network-first, fall back to the matching app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => {
            c.put(request, copy);
            if (isReadRoute(url)) c.put("/read", res.clone());
          });
          return res;
        })
        .catch(async () => {
          return (
            (await matchShell(request, url)) ||
            new Response("Offline", { status: 503 })
          );
        }),
    );
    return;
  }

  // Bible JSON packs: cache-first so downloaded translations work offline.
  if (isBiblePack(url)) {
    event.respondWith(
      (async () => {
        const packHit = await caches.open(BIBLE_PACK_CACHE).then((c) => c.match(request));
        if (packHit) return packHit;
        const assetHit = await caches.open(ASSET_CACHE).then((c) => c.match(request));
        if (assetHit) return assetHit;
        try {
          const res = await fetch(request);
          if (res.ok) {
            const copy = res.clone();
            caches.open(BIBLE_PACK_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        } catch {
          return packHit || assetHit || new Response("{}", { status: 504 });
        }
      })(),
    );
    return;
  }

  // Bible content API: stale-while-revalidate.
  if (isApi(url)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Reader client fetches: when offline, serve the cached reader shell.
  if (isReadRoute(url)) {
    event.respondWith(
      fetch(request).catch(async () => {
        return (await matchShell(request, url)) || new Response("", { status: 504 });
      }),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return cached || new Response("", { status: 504 });
      }
    }),
  );
});
