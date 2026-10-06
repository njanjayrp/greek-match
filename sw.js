const CACHE = 'greek-match';

// Enough to open the app with no network; everything else (a grammar drill
// script, an icon) is cached the first time it is fetched.
const CORE = [
    './',
    './index.html',
    './css/game.css',
    './js/game.js',
    './words.json',
    './sentences.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

// Network first: the app is small, and this way an edit is live on the next
// load without anyone bumping a version. The cache is the offline fallback.
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET' || url.origin !== location.origin) return;
    e.respondWith(
        fetch(e.request)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(e.request, { ignoreSearch: true })
                               .then(hit => hit || caches.match('./index.html')))
    );
});
