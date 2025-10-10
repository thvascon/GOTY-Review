// Service Worker para CoDEX PWA
// Versão do cache - aumente esse número quando quiser forçar atualização
const CACHE_VERSION = 'codex-v1';

// Arquivos essenciais que queremos cachear imediatamente
const ESSENTIAL_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.svg',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Cacheando arquivos essenciais');
      return cache.addAll(ESSENTIAL_CACHE);
    })
  );

  // Força o SW a se tornar ativo imediatamente
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Toma controle de todas as páginas imediatamente
  return self.clients.claim();
});

// Interceptação de requisições (estratégia: Network First, Cache Fallback)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições para APIs externas (Supabase, etc)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return; // Deixa passar requisições externas
  }

  event.respondWith(
    // Tenta buscar da rede primeiro
    fetch(event.request)
      .then((response) => {
        // Se conseguiu da rede, guarda no cache para uso futuro
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhou na rede, busca do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Servindo do cache:', event.request.url);
            return cachedResponse;
          }

          // Se não tem no cache e é uma navegação, retorna página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Notificações Push (para futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  const options = {
    body: event.data ? event.data.text() : 'Nova atualização no CoDEX!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('CoDEX', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
