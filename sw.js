/* Hayat Paneli: keeps the app shell on the phone so it opens offline, shows the app's own notifications (Web Push) and opens the app when one is tapped. */
const CACHE = "hayat-v281", AYAR = "hayat-ayar";
const SHELL = ["./", "index.html", "manifest.webmanifest", "ikon-180.png", "ikon-192.png", "ikon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AYAR).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith("/") || u.pathname.endsWith("/index.html")) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); if (r.ok) caches.open(CACHE).then(x => x.put("index.html", c)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  if (e.request.mode === "navigate" || u.pathname.includes("/sunucu/")) return;   /* kurulum.html, sunucu kodu: her zaman ağdan, önbelleğe girmez */
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.hash) || "#bugun";
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(cs => {
    for (const c of cs) if ("focus" in c) { c.postMessage({hash}); return c.focus(); }
    return self.clients.openWindow("./" + hash);
  }));
});
/* Sunucu boş bir "dürtme" yollar; metni buradan, kendi sunucundan alırız (şifreleme gerekmez). */
self.addEventListener("push", e => { e.waitUntil(bildirimGoster(e)); });
async function bildirimGoster(e){
  let liste = [];
  try { if (e.data) { const j = e.data.json(); liste = Array.isArray(j) ? j : [j]; } } catch (x) {}
  if (!liste.length) {
    try {
      const r = await (await caches.open(AYAR)).match("oturum"), o = r && await r.json();
      if (o && o.adres) {
        const res = await fetch(o.adres, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify({k: o.k, op: "bildirimAl"}), redirect: "follow", credentials: "omit"});
        liste = ((await res.json()).bildirimler) || [];
      }
    } catch (x) {}
  }
  if (!liste.length) liste = [{baslik: "Hayat", metin: "Yeni bir hatırlatma var.", hash: "#bugun"}];
  await Promise.all(liste.slice(-4).map(b => self.registration.showNotification(b.baslik || "Hayat", {body: b.metin || "", tag: b.id || undefined, icon: "ikon-192.png", badge: "ikon-192.png", data: {hash: b.hash || "#bugun"}})));
  try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(liste.length); } catch (x) {}
}
