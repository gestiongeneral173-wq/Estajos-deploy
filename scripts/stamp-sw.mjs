import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Estampa la versión de package.json en el nombre de caché de sw.js. Cada
// release queda así con un nombre de caché distinto, y el propio `activate`
// de sw.js (que ya borra cualquier caché que no coincida con el actual) hace
// la limpieza sola — sin esto, `CACHE` se quedaba fijo y la caché vieja nunca
// se purgaba.
//
// Corre DESPUÉS de `vite build`, sobre el `sw.js` ya copiado a `dist/`, no
// sobre el de `public/`: así el fuente versionado no queda "sucio" cada vez
// que alguien compila en local.
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(
  readFileSync(join(raiz, "package.json"), "utf8"),
);

const rutaSw = join(raiz, "dist", "sw.js");
const swActual = readFileSync(rutaSw, "utf8");

if (!/const CACHE = ".*?";/.test(swActual)) {
  throw new Error("No se encontró `const CACHE = \"...\";` en public/sw.js");
}

const swNuevo = swActual.replace(
  /const CACHE = ".*?";/,
  `const CACHE = "estajos-v${version}";`,
);

writeFileSync(rutaSw, swNuevo);
console.log(`sw.js -> estajos-v${version}`);
