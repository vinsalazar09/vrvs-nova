// VRVS Nova — Service Worker — Etapa 2.5
// Localização: raiz do projeto (escopo: /vrvs-nova/)
// Estratégia: cache-first apenas para ícones.
// HTML e módulos JS sempre buscados da rede — desenvolvimento ativo.

const CACHE_NAME = 'vrvs-shell-v3-pacote-7c2b-20260526';

const STATIC_ASSETS = [
  '/vrvs-nova/public/icons/icon-180.png',
  '/vrvs-nova/public/icons/icon-192.png',
  '/vrvs-nova/public/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { pathname } = new URL(e.request.url);

  // Ícones: cache-first (não mudam entre etapas)
  if (pathname.includes('/icons/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // HTML, JS, módulos: sempre rede (atualiza imediatamente após deploy)
  e.respondWith(fetch(e.request));
});
