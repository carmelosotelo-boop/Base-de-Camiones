/* Guarda la app en el equipo para que abra sin internet.
   Al publicar una versión nueva de index.html, cambiar el número de VERSION. */
const VERSION = 'humedad-v2';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(ARCHIVOS.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;                                   // los datos (POST) van siempre al servidor
  if (/google\.com$|googleusercontent\.com$/.test(u.hostname)) return;
  if (u.origin === location.origin) {
    // la app: intenta la versión nueva; sin conexión usa la guardada
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // librerías externas (unificador de PDF): primero la copia guardada
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
});
