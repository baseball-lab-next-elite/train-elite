const CACHE_NAME = 'train-elite-v8';
const STATIC_ASSETS = [
  'app.html',
  'manifest.json',
  'icon.png',
  'icon_large.png'
];

// インストール時に静的ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// GASへのリクエストはキャッシュしない（Network Only）
// 静的ファイルはNetwork First（オフライン時はキャッシュから）
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // GASへのリクエストはそのまま通す
  if (url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 静的アセットはNetwork First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});