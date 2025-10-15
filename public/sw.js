const CACHE_STATIC = "static-v1";
const CACHE_DYNAMIC = "dynamic-v1";
const CACHE_IMGS = "images-v1";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/", // Home
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/styles.css",
  "/offline.html", // nuestra página offline personalizada
];

//  Instalar: cachear el App Shell y offline page
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(APP_SHELL))
  );
});

//  Activar: limpiar cachés antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMGS].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

//  Estrategias de cacheo según el tipo de recurso
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignorar llamadas del navegador a extensiones u otros
  if (request.url.startsWith("chrome-extension")) return;

  // Solo interceptar GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  //  App Shell → Cache First
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  //  Imágenes → Stale While Revalidate
  if (request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_IMGS).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached); // si falla, usa la caché
        return cached || network;
      })
    );
    return;
  }

  //  Peticiones a API → Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_DYNAMIC).then((cache) =>
            cache.put(request, resClone)
          );
          return res;
        })
        .catch(() => caches.match(request)) // si falla, usa caché
    );
    return;
  }

  //  Navegaciones → fallback offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  //  Todo lo demás → Cache First
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Background Sync (mantén esta parte si la tienes implementada)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-entries") {
    event.waitUntil(syncEntries());
  }
});
//  Escuchar evento push
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Notificación", body: "Tienes un nuevo mensaje" };
  }

  const title = data.title || "📢 Notificación PWA";
  const options = {
    body: data.body || "Nuevo contenido disponible.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.url || "/",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 🔁 Abrir la app al hacer clic en la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || "/";
  event.waitUntil(clients.openWindow(urlToOpen));
});


//  Ejemplo de sincronización con IndexedDB
async function syncEntries() {
  const db = await openDB("sync-db", 1);
  const tx = db.transaction("entries", "readwrite");
  const store = tx.objectStore("entries");
  const allEntries = await store.getAll();

  for (const entry of allEntries) {
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      await store.delete(entry.id);
      console.log("✅ Enviado al servidor y eliminado:", entry);
    } catch (err) {
      console.warn("⚠️ Error enviando entry, se mantiene offline:", err);
    }
  }

  await tx.done;
}
