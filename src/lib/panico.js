/**
 * Detector del corte de emergencia.
 *
 * Cuando un administrador pulsa el botón de pánico, la base le retira los
 * permisos a `anon` y `authenticated` (ver `0014_panico.sql`). A partir de ahí
 * TODA consulta falla, en cualquier navegador que tuviera la aplicación
 * abierta. Esto lo reconoce y avisa a la pantalla para que no enseñe nada más
 * que el logo.
 *
 * No es la medida de seguridad — la medida es el REVOKE, que ocurre dentro de
 * Postgres y no se puede sortear desde el navegador. Esto sólo evita que la
 * pantalla se quede enseñando errores rojos sin explicar qué ha pasado.
 *
 * El estado es reversible a propósito: la sonda lo pone y lo quita, así que en
 * cuanto se restablecen los permisos la aplicación vuelve sola sin que haya que
 * vaciar nada a mano.
 */

// Sin USAGE sobre el esquema, la tabla ni siquiera se resuelve: PostgREST
// contesta "no existe" en vez de "sin permiso". Los dos casos son el corte.
const CODIGOS = new Set([
  "42501", // insufficient_privilege
  "42P01", // undefined_table
  "42883", // undefined_function
  "3F000", // invalid_schema_name
  "PGRST106", // el esquema no está expuesto
  "PGRST202", // la función no existe en el catálogo de PostgREST
  "PGRST301", // JWT rechazado
]);

let cortado = false;
const oyentes = new Set();

export const hayCorte = () => cortado;

/** ¿Este error puede ser el corte? No lo confirma: sólo levanta la sospecha. */
export const pareceCorte = (error) => Boolean(error) && CODIGOS.has(error.code ?? "");

export function alCortar(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/**
 * Lo pone y lo quita la sonda de `supabase.js`. Nunca a partir de un error
 * suelto: un fallo de permisos sobre una tabla concreta no significa que la
 * base esté cortada, y darlo por hecho dejaba la aplicación bloqueada con todo
 * en orden.
 */
export function fijarCorte(valor) {
  if (valor === cortado) return;
  cortado = valor;
  for (const fn of oyentes) fn();
}

/** Tras pulsar el botón: no hay nada que consultar, se corta y punto. */
export const marcarCorte = () => fijarCorte(true);
