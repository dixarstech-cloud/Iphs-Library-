/* IPHS School Library service worker: lets the app open and work with no internet. */
const CACHE = "iphs-library-v3";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u))).then(() => fetch("./dict-index.json").then(r => r.ok ? r.json() : []).then(files => Promise.allSettled(files.map(f => c.add("./" + f)))).catch(() => { }))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Pages: try the network first so updates arrive, fall back to the saved copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html").then(r => r || caches.match("./"))));
    return;
  }
  // Everything else (icons, fonts): serve the saved copy now, refresh it in the background.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || fresh;
    }));
  }
});
