const CACHE_NAME = "mizanim-v2";
const OFFLINE_URL = "/offline";

// Kurulumda önbelleğe alınacak kritik statik varlıklar
const PRECACHE_ASSETS = [
  "/offline",
  "/manifest.json",
  "/favicon.png",
  "/logo.png",
];

// API ve auth rotaları her zaman network-first
const NETWORK_ONLY_PATTERNS = [
  /^\/api\//,
  /\/auth\//,
  /supabase\.co/,
];

// Statik varlıklar cache-first
const CACHE_FIRST_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(woff|woff2|ttf|otf)$/,
  /\/_next\/static\//,
];

// ─── Install ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece GET isteklerini yakala
  if (request.method !== "GET") return;

  // Network-only: API, auth, harici servisler
  if (NETWORK_ONLY_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: "Bağlantı yok" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // Cache-first: statik varlıklar
  if (CACHE_FIRST_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Network-first with offline fallback: sayfalar
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Başarılı HTML yanıtlarını cache'e ekle
        if (response.ok && request.headers.get("accept")?.includes("text/html")) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Offline: cache'den dene
        const cached = await caches.match(request);
        if (cached) return cached;

        // HTML isteğiyse offline sayfasını göster
        if (request.headers.get("accept")?.includes("text/html")) {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        return new Response("Bağlantı yok", { status: 503 });
      })
  );
});

// ─── Push Notifications (gelecek) ────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Mizanım";
  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag ?? "mizanim",
    data: { url: data.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
