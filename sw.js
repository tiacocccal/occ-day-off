const CACHE_NAME = 'occ-silent-v3';

// 安裝時立刻接管，不跳出任何通知
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// 活化時在背景默默刪除舊快取，不打擾使用者
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 純靜態轉發，不鎖死任何網頁資源
self.addEventListener('fetch', function(event) {
  // 保持空檔，讓所有請求直接走網路撈最新進度
});
