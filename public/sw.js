// Lumina Bible service worker — offline-first caching.
// Registered as /sw.js?v=<deployment id>, so every deploy installs a fresh
// worker with fresh caches (old ones are dropped on activate).
const BUILD = new URL(self.location.href).searchParams.get("v") || "dev";
const VERSION = `lumina-${BUILD}`;
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
  "/progress",
  "/bookmarks",
  "/prayers",
  "/journal",
  "/settings",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/offline.html",
  "/bible/manifest.json",
];

const API_WARM_URLS = ["/api/plans", "/api/available"];

// Pull every /_next/static script, style and font a page references.
function assetUrls(html) {
  const out = new Set();
  const re = /\/_next\/static\/[^"'\s)\\]+/g;
  let m;
  while ((m = re.exec(html))) out.add(m[0]);
  return [...out];
}

/**
 * Cache every app screen *and* the build assets each one needs, plus the
 * reading-plan pages, so the whole app (not only Bible text) works offline.
 * Safe to run repeatedly: assets already cached are skipped.
 */
async function precacheApp() {
  const shell = await caches.open(SHELL_CACHE);
  const assets = await caches.open(ASSET_CACHE);
  const api = await caches.open(API_CACHE);

  const pages = [...SHELL_URLS];
  try {
    const res = await fetch("/api/plans", { cache: "no-cache" });
    if (res.ok) {
      await api.put("/api/plans", res.clone());
      const { plans = [] } = await res.json();
      for (const p of plans) if (p.slug) pages.push(`/today/${p.slug}`);
    }
  } catch {
    /* offline — keep whatever is cached */
  }
  await Promise.allSettled(
    API_WARM_URLS.filter((u) => u !== "/api/plans").map(async (u) => {
      const res = await fetch(u, { cache: "no-cache" });
      if (res.ok) await api.put(u, res);
    }),
  );

  const wanted = new Set();
  await Promise.allSettled(
    pages.map(async (u) => {
      const res = await fetch(u, { cache: "no-cache" });
      if (!res.ok) return;
      await shell.put(u, res.clone());
      if ((res.headers.get("content-type") || "").includes("text/html")) {
        for (const a of assetUrls(await res.text())) wanted.add(a);
      }
    }),
  );
  await Promise.allSettled(
    [...wanted].map(async (u) => {
      if (await assets.match(u)) return;
      const res = await fetch(u);
      if (res.ok) await assets.put(u, res);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheApp().catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "warm-app") {
    event.waitUntil(precacheApp().catch(() => {}));
  }
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

  // Never cache health or version checks.
  if (url.pathname === "/api/health" || url.pathname === "/api/version") return;

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

  // Other public files (manifest, icons, splash images): network-first, so a
  // new deploy shows up right away; the cached copy is the offline fallback.
  if (!url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          // Any cache: the manifest and icons are precached with the shell.
          return (await caches.match(request)) || new Response("", { status: 504 });
        }
      }),
    );
    return;
  }

  // Build assets have content-hashed names: cache-first.
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
