// Service worker mínimo: existe para que la aplicación sea instalable y para
// que el armazón (HTML, JS, CSS, iconos) siga abriendo sin cobertura, cosa que
// en campo pasa a diario.
//
// Lo que NO hace, a propósito: cachear datos. Todo lo que va a Supabase es de
// otro origen y se deja pasar sin tocar. Un parte servido desde caché sería
// peor que un error honesto — el encargado necesita saber que no ha subido.
//
// ponytail: caché en tiempo de ejecución, sin lista de precarga. Si algún día
// hace falta que la primera visita ya funcione sin red, toca precargar el
// manifiesto de assets de Vite, y ahí sí compensa vite-plugin-pwa.
const CACHE = "estajos-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return; // Supabase y las fuentes, intactos.

  // Navegación: red primero, y si no hay, el último index.html que se vio.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copia));
          return respuesta;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Assets: caché primero. Los nombres de Vite llevan hash, así que un fichero
  // cacheado nunca queda obsoleto; cuando cambia, cambia también su nombre.
  evento.respondWith(
    caches.match(peticion).then(
      (guardado) =>
        guardado ||
        fetch(peticion).then((respuesta) => {
          if (respuesta.ok && respuesta.type === "basic") {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(peticion, copia));
          }
          return respuesta;
        }),
    ),
  );
});
