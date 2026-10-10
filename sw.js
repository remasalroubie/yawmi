/* =========================================================
   يومي ✦ service worker: يخلي التطبيق يشتغل بدون نت
   مهم: كل ما عدّلتي في الكود غيّري رقم النسخة تحت (v1 ← v2 ← v3...)
   عشان الجوال ياخذ التحديث.
   ========================================================= */
const CACHE = 'yawmi-v1';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

/* يعرض من الكاش فوراً، ويحدّث نسخة الكاش في الخلفية (يشمل خطوط Google) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});