const CACHE_NAME = "semeador-vej-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Só cuida de arquivos do próprio site (mesmo domínio, método GET).
  // Chamadas de API (POST, PUT, ou pra domínio de fora, tipo Anthropic/Google) passam direto,
  // sem o Service Worker se meter no meio.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return; // deixa passar sem interceptar
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
