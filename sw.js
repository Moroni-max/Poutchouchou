const CACHE_NAME = "carnet-de-voyage-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./weekly-data.js",
  "./budget-data.js",
  "./conges.js",
  "./firebase-config.js",
  "./manifest.json",
  "./icon.png",
  "./img/dev/semaine-04.png",
  "./img/dev/semaine-05.png",
  "./img/dev/semaine-06.png",
  "./img/dev/semaine-07.png",
  "./img/dev/semaine-08.png",
  "./img/dev/semaine-09.png",
  "./img/dev/semaine-10.png",
  "./img/dev/semaine-11.png",
  "./img/dev/semaine-12.png",
  "./img/dev/semaine-13.png",
  "./img/dev/semaine-14.png",
  "./img/dev/semaine-15.png",
  "./img/dev/semaine-16.png",
  "./img/dev/semaine-17.png",
  "./img/dev/semaine-18.png",
  "./img/dev/semaine-19.png",
  "./img/dev/semaine-20.png",
  "./img/dev/semaine-21.png",
  "./img/dev/semaine-22.png",
  "./img/dev/semaine-23.png",
  "./img/dev/semaine-24.png",
  "./img/dev/semaine-25.png",
  "./img/dev/semaine-26.png",
  "./img/dev/semaine-27.png",
  "./img/dev/semaine-28.png",
  "./img/dev/semaine-29.png",
  "./img/dev/semaine-30.png",
  "./img/dev/semaine-31.png",
  "./img/dev/semaine-32.png",
  "./img/dev/semaine-33.png",
  "./img/dev/semaine-34.png",
  "./img/dev/semaine-35.png",
  "./img/dev/semaine-36.png",
  "./img/dev/semaine-37.png",
  "./img/dev/semaine-38.png",
  "./img/dev/semaine-39.png",
  "./img/dev/semaine-40.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
