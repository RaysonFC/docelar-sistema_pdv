// =====================
//  SERVICE WORKER — Docelar PDV
//  Versão do cache — atualize quando mudar os arquivos
// =====================
const CACHE_NAME = 'docelar-v1';

const ARQUIVOS = [
  '/docelar-sistema_pdv/index.html',
  '/docelar-sistema_pdv/relatorio.html',
  '/docelar-sistema_pdv/style.css',
  '/docelar-sistema_pdv/script.js',
  '/docelar-sistema_pdv/manifest.json',
  '/docelar-sistema_pdv/icon-192.png',
  '/docelar-sistema_pdv/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Nunito:wght@400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Instala e faz cache de todos os arquivos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar nova versão
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve do cache, tenta rede se não encontrar
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cacheia recursos novos dinamicamente
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e não tem no cache — retorna index.html como fallback
        if (e.request.destination === 'document') {
          return caches.match('/docelar-sistema_pdv/index.html');
        }
      });
    })
  );
});
