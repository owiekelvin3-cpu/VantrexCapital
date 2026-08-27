/* Vantrex Capital — PWA + push service worker */
const CACHE_VERSION = "vantrex-shell-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
];

const ASSET_EXT = /\.(?:css|woff2?|png|jpg|jpeg|gif|svg|webp|avif)$/i;
const VIDEO_EXT = /\.(?:mp4|webm|ogg|mov)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigate(request) {
  return request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function shouldBypass(url) {
  const path = url.pathname;
  return (
    path.startsWith("/api/") ||
    path.includes("supabase") ||
    path.endsWith("/sw.js") ||
    path.includes("chrome-extension")
  );
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      cache.put("/index.html", fresh.clone());
    }
    return fresh;
  } catch {
    return (
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

/** Never cache-first hashed JS — stale chunks break lazy dashboard routes after deploys. */
async function networkFirstScript(request) {
  try {
    const fresh = await fetch(request);
    return fresh;
  } catch {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (!isSameOrigin(url) || shouldBypass(url)) return;

  if (isNavigate(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (VIDEO_EXT.test(url.pathname) || url.pathname.startsWith("/videos/")) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/assets/") && url.pathname.endsWith(".js")) {
    event.respondWith(networkFirstScript(request));
    return;
  }

  if (url.pathname.startsWith("/assets/") || ASSET_EXT.test(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.svg" ||
    url.pathname === "/logo.svg"
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Vantrex Capital",
    body: "You have a new notification.",
    url: "/dashboard",
    silent: false,
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/favicon.svg",
      tag: payload.tag || "vantrex-notification",
      renotify: true,
      silent: payload.silent === true,
      vibrate: [100, 50, 100],
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  const target = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus().then((focused) => {
            if ("navigate" in focused) {
              return focused.navigate(target);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
    return;
  }

  if (event.data?.type !== "SHOW_NOTIFICATION") return;

  const { title, body, url, tag, silent } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/favicon.svg",
      tag: tag || "vantrex-notification",
      renotify: true,
      silent: silent === true,
      vibrate: [100, 50, 100],
      data: { url: url || "/dashboard" },
    })
  );
});
