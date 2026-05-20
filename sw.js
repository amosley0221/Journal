// App-shell service worker for Journal+.
// Caches the shell (HTML, JSX, icons, manifest) so the app launches offline,
// then falls back to network for everything else.

const CACHE = 'journal-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './sync.jsx',
  './auth.jsx',
  './data.jsx',
  './skins.jsx',
  './app.jsx',
  './entry-view.jsx',
  './entry-canvas.jsx',
  './map-overlay.jsx',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache Supabase API traffic — it must always hit the network.
  if (url.hostname.endsWith('.supabase.co')) return;

  // For same-origin shell assets, prefer cache; fall back to network and update cache.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    );
    return;
  }

  // Cross-origin (CDN: React, Babel, Supabase JS, fonts) — network first, cache fallback.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && res.type !== 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
