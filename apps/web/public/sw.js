const CACHE_NAME = 'lardosanjos-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE = ['/', OFFLINE_URL, '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

const PRIVATE_PREFIXES = ['/dashboard', '/entrar', '/anjo/validar'];
const PRIVATE_EXACT = new Set(['/doacao/sucesso', '/doacao/pendente', '/doacao/falha']);

function shouldBypassCache(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    if (path.startsWith('/api') || path.startsWith('/_next/data')) return true;
    if (parsed.searchParams.has('_rsc') || parsed.searchParams.has('token')) return true;
    if (PRIVATE_EXACT.has(path)) return true;

    return PRIVATE_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  } catch {
    return true;
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
    pathname === OFFLINE_URL
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = event.request.url;
  if (shouldBypassCache(requestUrl)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response.ok) return response;

          const parsed = new URL(requestUrl);
          if (
            parsed.origin === self.location.origin &&
            (isStaticAsset(parsed.pathname) || parsed.pathname === '/')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }

          return response;
        })
        .catch(async () => {
          if (event.request.mode === 'navigate') {
            const offline = await caches.match(OFFLINE_URL);
            if (offline) return offline;
          }
          throw new Error('Network unavailable');
        });
    }),
  );
});
