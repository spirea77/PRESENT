// 오늘도 선물 — 오프라인 저장
// 인터넷이 될 때 열면 고친 내용이 자동으로 반영된다. (버전 숫자는 저장본을 통째로 비우고 싶을 때만 올린다)
const VERSION = 'gift-v5';
const CORE = [
  './', 'index.html', 'manifest.json',
  'assets/player.png', 'assets/cheer.png', 'assets/title.png', 'assets/icon-512.png',
  'assets/card_special.jpg', 'assets/card_love.jpg', 'assets/card_lucky.jpg',
  'assets/card_nice.jpg', 'assets/card_letter.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    // 글꼴(바뀌지 않는 파일)만 저장본 먼저.
    // 화면과 그림은 인터넷 먼저 — 고친 내용이 바로 보이고, 인터넷이 끊기면 저장본으로 연다.
    if (new URL(req.url).hostname.endsWith('gstatic.com')) {
      const hit = await cache.match(req);
      if (hit) return hit;
    }
    try {
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    } catch (err) {
      const saved = await cache.match(req, { ignoreSearch: isPage });
      return saved || (isPage ? cache.match('index.html') : Response.error());
    }
  })());
});
