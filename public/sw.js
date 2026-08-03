// Service worker básico da TV Attual
// Guarda o "casco" do app em cache para abrir rápido e funcionar offline.
// Streams de vídeo/áudio NUNCA são cacheados (sempre ao vivo).

const CACHE = 'tv-attual-v1'

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  const url = new URL(request.url)

  // Só GET do próprio domínio; streams e mídia ao vivo passam direto
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (/\.(m3u8|m3u|ts|mp3|aac)$/.test(url.pathname)) return

  // Rede primeiro (app sempre atualizado); cache como reserva offline
  evento.respondWith(
    fetch(request)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copia))
        return resposta
      })
      .catch(() =>
        caches.match(request).then((guardado) => guardado || caches.match('/'))
      )
  )
})
