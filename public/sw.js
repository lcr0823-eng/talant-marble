const CACHE = 'talant-marble-v1';
const ASSETS = ['/', '/index.html', '/app.js', '/animate.js', '/sound.js', '/effects.js', '/effects.css', '/modes.js', '/gameplus.js', '/music-player.js', '/style.css', '/manifest.json', '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  // API 요청은 캐시 안 씀
  if (e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
