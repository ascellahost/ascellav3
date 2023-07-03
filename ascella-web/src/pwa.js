
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('install', (event) => {
  self.skipWaiting()
});


self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/upload' && url.searchParams.has('share-target')) {

    const newUuid = crypto.randomUUID();

    // save image in cache with uuid
    const promiseChain = async () => {
      const data = await event.request.formData();
      const file = data.get('file');
      console.log('files', file);

      const cache = await caches.open('ascella');

      await cache.put(
        new Request(`/upload/${newUuid}`),
        new Response(file, {
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${newUuid}"`
        }
      }));
    }

    event.respondWith(Response.redirect('/upload?receiving-file-share=1&uuid=' + newUuid));

    self.waitUntil(promiseChain());
  } else {
    event.respondWith(fetch(event.request));
  }
});