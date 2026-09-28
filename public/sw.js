// Service worker minimal pour Libota.
//
// Rôle unique : permettre l'installation de l'app sur l'écran d'accueil
// (Chrome/Android exige un service worker actif avec un gestionnaire
// "fetch" pour proposer l'installation). Volontairement PAS de cache :
// aucune ressource n'est interceptée ni servie hors-ligne, tout part
// toujours au réseau. Pas de mode hors-ligne, comme demandé.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through pur : on ne fait que renvoyer la requête réseau telle
  // quelle, sans jamais toucher à un cache.
  event.respondWith(fetch(event.request));
});
