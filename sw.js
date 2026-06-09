const CACHE_NAME = 'train-elite-v33';
const STATIC_ASSETS = [
  'app.html',
  'manifest.json',
  'icon.png',
  'icon_large.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // GASへのリクエスト・chrome拡張・非HTTPはSWで一切触らない
  if (
    url.includes('script.google.com') ||
    url.startsWith('chrome-extension') ||
    !url.startsWith('http')
  ) {
    return; // respondWith を呼ばずにスルー
  }

  // 静的アセットはNetwork First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
