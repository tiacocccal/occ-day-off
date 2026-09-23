const CACHE_NAME = 'occ-app-v5-final';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of STATIC_ASSETS) {
        try { await cache.add(url); } catch (e) { /* 某個檔案不存在時不阻斷整體安裝 */ }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Apps Script / Google API 資料必須維持即時，不做離線快取。
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('.googleusercontent.com')) {
    return;
  }

  // HTML 導航：優先網路，失敗時回退到已快取的首頁。
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 本機靜態檔與 CDN 套件：先回快取，同時背景更新。
  const cacheable =
    url.origin === self.location.origin ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.jsdelivr.net';

  if (cacheable) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
