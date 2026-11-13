'use strict';
/* Service Worker: macht die Seite als App startbar. Netzwerk zuerst (immer aktuell), bei fehlendem Netz kommt die gespeicherte Version.
   Supabase und alles Fremde bleibt unberührt, es wird nur die eigene Seite gespeichert. */
const CACHE = 'koffein-v1';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'i18n.js', 'chaos.js', 'water.js', 'ui.js', 'pwa.js', 'supabase.js', 'config.js',
  'favicon.svg', 'manifest.webmanifest', 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /\/music\//.test(url.pathname)) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
