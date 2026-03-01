// Shelley Guitar — Service Worker
// Hand-rolled, zero dependencies. Manages offline shell + game asset caching.

const CACHE_VERSION = "v1";
const PRECACHE = `shelley-precache-${CACHE_VERSION}`;
const RUNTIME = `shelley-runtime-${CACHE_VERSION}`;
const GAME_CACHE = `shelley-games-${CACHE_VERSION}`;

// Max number of WASM files to keep in game cache (~36MB each)
const MAX_GAME_WASM_ENTRIES = 3;

const PRECACHE_URLS = [
  "/",
  "/workshop",
  "/gallery",
  "/librarynth",
  "/contact",
  "/fonts/press-start-2p.woff2",
  "/sprites/po/idle_sheet.png",
  "/sprites/po/idle_00.png",
  "/sprites/po/costumes/craftsman_idle_sheet.png",
  "/sprites/po/costumes/artist_idle_sheet.png",
  "/sprites/po/costumes/scholar_idle_sheet.png",
  "/sprites/po/costumes/messenger_idle_sheet.png",
  "/sprites/po/costumes/sleepy_idle_sheet.png",
  "/sprites/po/costumes/glitch_idle_sheet.png",
  "/_offline.html",
];

// ── Install: precache shell assets ──

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──

self.addEventListener("activate", (event) => {
  const currentCaches = [PRECACHE, RUNTIME, GAME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("shelley-") && !currentCaches.includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

// ── Fetch: route requests to caching strategies ──

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Game HTML: network-only (COOP/COEP headers must be fresh)
  if (/^\/games\/[^/]+\/index\.html$/.test(url.pathname)) {
    return;
  }

  // Game WASM/PCK: cache-first (36MB each, cache on first play)
  if (/^\/games\/.*\.(wasm|pck)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, GAME_CACHE, true));
    return;
  }

  // Game JS: stale-while-revalidate
  if (/^\/games\/.*\.js$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, GAME_CACHE));
    return;
  }

  // Fonts: cache-first (precached, immutable)
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(request, PRECACHE, false));
    return;
  }

  // Sprites: stale-while-revalidate
  if (url.pathname.startsWith("/sprites/")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }

  // API routes: network-only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Next.js static assets: stale-while-revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request, RUNTIME));
});

// ── Caching strategies ──

async function cacheFirst(request, cacheName, pruneGames) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (pruneGames) pruneGameCache();
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PRECACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/_offline.html");
  }
}

// ── Game cache size management ──
// Keep at most MAX_GAME_WASM_ENTRIES WASM files to cap disk usage (~108MB)

async function pruneGameCache() {
  const cache = await caches.open(GAME_CACHE);
  const keys = await cache.keys();
  const wasmKeys = keys.filter((req) => req.url.endsWith(".wasm"));

  if (wasmKeys.length > MAX_GAME_WASM_ENTRIES) {
    const toDelete = wasmKeys.slice(0, wasmKeys.length - MAX_GAME_WASM_ENTRIES);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}
