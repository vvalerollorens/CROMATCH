// Network-only for all authenticated data. Never cache inventory or sessions.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { if(event.request.mode==='navigate') event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><title>Sin conexión · CROMATCH</title><body style="font:18px system-ui;padding:2rem"><h1>Estás sin conexión</h1><p>Vuelve a conectarte para consultar y guardar tu colección de forma segura.</p><a href="/">Reintentar</a></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}}))); });
