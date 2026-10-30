// Responde do cache (funciona offline na academia) e atualiza o cache em segundo plano.
const CACHE = 'treino-v1';
const ARQUIVOS = ['./', 'index.html', 'app.js', 'logic.js', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const salvo = await c.match(e.request);
    const rede = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => salvo);
    return salvo || rede;
  }));
});
