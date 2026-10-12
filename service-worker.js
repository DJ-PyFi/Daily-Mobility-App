// Bump this version any time app files change, to invalidate old caches.
const CACHE_VERSION = 'ten-min-mobility-v7';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts/caprasimo-latin.woff2',
  './fonts/caprasimo-latin-ext.woff2',
  './fonts/figtree-latin.woff2',
  './fonts/figtree-latin-ext.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/silence.mp4',
  './assets/silence.webm',
  './assets/cues/three.mp3',
  './assets/cues/two.mp3',
  './assets/cues/one.mp3',
  './assets/cues/switch.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // The app page itself: try the network first so updates show up right away,
  // and fall back to the saved copy when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html').then((c) => c || caches.match('./')))
    );
    return;
  }

  // Everything else: cache-first, so the routine works with no signal.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
