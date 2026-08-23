import { createClient } from "@supabase/supabase-js";

import { fijarCorte, hayCorte, pareceCorte } from "./panico.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellénalas.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/**
 * Los errores de PostgREST llegan con `code`, `message` y `hint`. Esto los
 * convierte en algo que se pueda enseñar sin filtrar detalles del esquema.
 */
export function mensajeDeError(error) {
  if (!error) return null;
  const codigo = error.code ?? "";

  // 42501 = permission denied. Casi siempre significa "este rol no puede",
  // no "algo está roto": vale la pena decirlo en ese idioma.
  if (codigo === "42501" || codigo === "PGRST301") return "No tienes permiso para hacer eso.";
  if (codigo === "23505") return "Ya existe un registro igual.";
  if (codigo === "23503") return "No se puede: hay datos que dependen de esto.";
  if (codigo === "23514") return "Algún dato no es válido.";
  if (codigo === "PGRST116") return "No se encontró el registro.";

  // Las excepciones de las funciones (raise exception) llegan tal cual y
  // están escritas para leerse.
  return error.message || "Ha ocurrido un error.";
}

/**
 * Sonda del corte de emergencia.
 *
 * `hoy_local()` es lo más barato que existe y es de las pocas cosas que `anon`
 * puede llamar sin sesión: no toca ninguna tabla. Cuando el corte está puesto,
 * el esquema entero deja de ser visible y esto falla; cuando no, contesta una
 * fecha.
 *
 * Importa que la sonda NO lea una tabla: `anon` nunca ha tenido permiso sobre
 * ellas —sólo `authenticated`—, así que una sonda contra `organizaciones` daba
 * 42501 a cualquiera que no hubiera entrado todavía y bloqueaba la pantalla de
 * login con la base intacta.
 */
export async function comprobarCorte() {
  const { error } = await supabase.rpc("hoy_local");
  fijarCorte(pareceCorte(error));
  return hayCorte();
}

/** Lanza si la respuesta trae error; si no, devuelve los datos. */
export function ok({ data, error }) {
  if (error) {
    // Un error de permisos no confirma el corte por sí solo: se comprueba
    // contra la sonda antes de tirar la pantalla abajo.
    if (pareceCorte(error) && !hayCorte()) comprobarCorte();
    throw new Error(mensajeDeError(error));
  }
  return data;
}
