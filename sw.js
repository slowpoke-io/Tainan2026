const CACHE_NAME = "tainan-trip-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
];

// 安裝時快取核心資源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()),
  );
});

// 啟用後清理舊快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 攔截請求
self.addEventListener("fetch", (event) => {
  // 針對導覽請求（開啟 App 時的行為）
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("./index.html") || caches.match("./");
      }),
    );
    return;
  }

  // 一般資源：先從快取找，找不到再走網路
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
