# Limpieza automática de la caché del service worker

## El problema

`public/sw.js` guarda los archivos estáticos (JS, CSS, íconos) en una caché
del navegador (`CacheStorage`) bajo un nombre fijo:

```js
const CACHE = "estajos-v1";
```

El propio service worker ya sabía borrar cachés viejas — su evento
`activate` borra cualquier caché cuyo nombre no sea el actual (`CACHE`). El
problema es que ese nombre nunca cambiaba de un release a otro, así que esa
limpieza nunca se disparaba: los archivos con hash de Vite de versiones
anteriores se quedaban acumulados en la caché para siempre, en vez de irse
reemplazando.

## La solución

[`scripts/stamp-sw.mjs`](../scripts/stamp-sw.mjs) corre **después** de
`vite build` (ver el script `build` en [`package.json`](../package.json)) y
reemplaza el `CACHE` del `sw.js` ya compilado en `dist/` por el número de
versión de `package.json`:

```json
"build": "vite build && node scripts/stamp-sw.mjs"
```

Con esto, cada release termina con un `dist/sw.js` cuyo nombre de caché es
distinto (`estajos-v15.0.0`, `estajos-v15.1.0`, etc.), y la limpieza que ya
existía en `activate` se dispara sola: al activarse la versión nueva del
service worker, borra la caché de la versión anterior completa.

### Por qué toca `dist/sw.js` y no `public/sw.js`

El script edita el archivo ya copiado a `dist/`, no el original en
`public/`. Si tocara el original, cada `npm run build` local dejaría el
archivo fuente "sucio" en git (con la versión estampada) aunque no hubiera
pasado nada real que commitear. Al tocar solo el artefacto de build,
`public/sw.js` se queda siempre con el placeholder (`estajos-v1`) en el
repositorio, y solo lo que efectivamente se despliega lleva el nombre real.

## Qué hay que hacer en cada release

Subir el número de `"version"` en `package.json` **antes** de compilar. Si
se olvida, el script no tiene nada nuevo que estampar, el nombre de caché
sale igual al del release anterior, y la limpieza no se dispara para esa
versión (no rompe nada, simplemente esa release en particular no purga la
caché vieja).

## Cómo verificar que funcionó

1. Correr `npm run build`.
2. Abrir `dist/sw.js` y confirmar que la línea `const CACHE = "..."` trae la
   versión actual de `package.json`.
3. En el navegador, después de desplegar: DevTools → Application → Cache
   Storage — debería aparecer solo la caché de la versión más reciente: las
   de releases anteriores desaparecen tras la primera recarga que active el
   `sw.js` nuevo.

## Qué NO toca este cambio

Nada de lo que va a Supabase se cachea nunca (ver el comentario al inicio de
`sw.js`) — esto solo limpia archivos estáticos del armazón (JS, CSS,
íconos), no datos ni sesión.
