/**
 * Hoy en formato ISO corto (yyyy-mm-dd), que es como viajan las fechas.
 *
 * En hora LOCAL, no UTC. Con `toISOString()` la fecha salta a la del día
 * anterior entre medianoche y las 01:00 o 02:00 de España, así que un parte
 * registrado a las 00:30 se guardaba con la fecha de ayer — y `enviar_parte`
 * lo sobreescribía encima del de ayer. El locale sueco es ISO 8601.
 */
export const hoy = () => new Date().toLocaleDateString("sv-SE");

export function formatFecha(fecha) {
  if (!fecha) return "—";
  const texto = new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return fecha === hoy() ? `Hoy · ${texto}` : texto;
}

/** "2026-08-03" -> "03/08" */
export const ddmm = (fecha) =>
  fecha ? `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}` : "";

/** Minúsculas sin acentos, para buscar "Nuñez" escribiendo "nunez". */
export const normalizar = (texto) =>
  (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function eur(n) {
  return `€${Number(n || 0).toFixed(2)}`;
}

// Identificador local para listas que aún no se han enviado (los
// temporales del asistente). Los ids de verdad los genera la base.
let secuencia = 0;
export const idLocal = () => `tmp-${++secuencia}`;

/**
 * La inicial del día de la semana de una fecha ISO, con las abreviaturas que
 * usa la casa: miércoles es "MI" de dos letras para no confundirlo con martes.
 *
 *   "2026-08-17" -> { letra: "L", finde: false }
 */
const LETRAS_DIA = ["D", "L", "M", "MI", "J", "V", "S"];
export function diaSemana(fecha) {
  if (!fecha) return null;
  const dia = new Date(fecha + "T00:00:00").getDay();
  return { letra: LETRAS_DIA[dia], finde: dia === 0 || dia === 6 };
}
