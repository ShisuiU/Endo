// Service worker "atelier" — cache le shell de l'app pour un lancement
// hors-ligne correct depuis l'écran d'accueil iOS, et met en cache les
// assets statiques Next.js. Ecrit à la main (pas de dépendance Workbox)
// pour rester lisible et sous contrôle.

const VERSION = "v1";
const SHELL_CACHE = `endo-shell-${VERSION}`;
const RUNTIME_CACHE = `endo-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // laisse passer Supabase & co.

  // Navigation (ouverture de l'app / changement de page) : réseau d'abord,
  // repli sur le cache puis sur la page hors-ligne.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Fichiers statiques Next.js (hashés, immuables) : cache d'abord.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Reste (icônes, css…) : stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
