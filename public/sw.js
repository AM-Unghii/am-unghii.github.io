// Service worker simplu: aplicația se deschide și fără internet.
// Pagini/fișiere: rețea mai întâi, cu copie în cache ca rezervă. Apelurile de sincronizare (POST, alt domeniu) nu sunt atinse.
const CACHE = 'programari-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  // paginile (index.html) se cer mereu de la server, ca o versiune nouă să apară imediat, nu după ~10 min de cache
  const page = r.mode === 'navigate' || r.destination === 'document';
  e.respondWith(
    (page ? fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r))
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match(self.registration.scope))),
  );
});
