const CACHE='borali-shell-v9';const SHELL=['/','/index.html','/style.css','/app.mjs','/core.mjs','/insights.mjs','/maps.mjs','/physiology.mjs','/sync-model.mjs','/cloud.mjs','/features.mjs','/password-recovery.mjs','/rhythm.mjs','/location.mjs','/step-analytics.mjs','/analytics-ui.mjs','/icon.svg','/icon-180.png','/icon-192.png','/icon-512.png','/manifest.webmanifest'];self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(path=>new Request(path,{cache:'reload'})))));});self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('borali-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(url.pathname);
  return cached||fetch(event.request);
 }));
});
