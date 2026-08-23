import { useCallback, useEffect, useMemo, useState } from "react";

import { ok, supabase } from "../lib/supabase.js";

/** Nombre de una persona del listado de campo, o "—" si ya no está. */
export const nombrePersona = (personas, id) =>
  personas.find((persona) => persona.id === id)?.nombre ?? "—";

/**
 * Datos de la aplicación de campo.
 *
 * El encargado ve el padrón y todos los partes de su organización (necesita
 * saber qué furgonetas ya han cerrado el día), pero no ve dinero: ni
 * adelantos, ni pagos, ni lo que cobra la furgoneta. Eso no lo decide esta
 * pantalla, lo decide RLS — aquí simplemente no se piden esas tablas.
 *
 * `registros` reconstruye la forma que espera la interfaz:
 *   { fecha: { vehiculoId: { encargado, registradoPor, chofer, pasajeros[], horasRoles{} } } }
 */
export function useCampo() {
  const [vehiculos, setVehiculos] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [registros, setRegistros] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    try {
      const [veh, trab, partes] = await Promise.all([
        supabase
          .from("vehiculos")
          .select("id, nombre, plazas_totales")
          .eq("activo", true)
          .order("nombre")
          .then(ok),
        supabase
          .from("trabajadores")
          .select("id, nombre, apellido, payment_period")
          .eq("activo", true)
          .order("nombre")
          .then(ok),
        supabase
          .from("partes")
          .select(
            "id, fecha, vehiculo_id, encargado_id, registrado_por, chofer_id, jornadas(trabajador_id, horas, destajo, rol)",
          )
          .not("vehiculo_id", "is", null)
          .order("fecha", { ascending: false })
          .limit(400)
          .then(ok),
      ]);

      const porFecha = {};
      for (const parte of partes) {
        const horasRoles = {};
        for (const j of parte.jornadas ?? []) {
          horasRoles[j.trabajador_id] = { horas: Number(j.horas), destajo: Number(j.destajo) };
        }
        const pasajeros = (parte.jornadas ?? [])
          .filter(
            (j) => j.trabajador_id !== parte.encargado_id && j.trabajador_id !== parte.chofer_id,
          )
          .map((j) => ({
            id: j.trabajador_id,
            horas: Number(j.horas),
            destajo: Number(j.destajo),
          }));

        porFecha[parte.fecha] ??= {};
        porFecha[parte.fecha][parte.vehiculo_id] = {
          // `encargado` es quien lleva la insignia a bordo — puede no haberlo.
          // `registradoPor` es de quien es el parte, que es otra cosa.
          encargado: parte.encargado_id,
          registradoPor: parte.registrado_por,
          chofer: parte.chofer_id,
          pasajeros,
          horasRoles,
        };
      }

      setVehiculos(veh.map((v) => ({ id: v.id, nombre: v.nombre, plazas: v.plazas_totales })));
      setPersonas(
        trab.map((t) => ({
          id: t.id,
          nombre: `${t.nombre} ${t.apellido}`.trim(),
          ciclo: t.payment_period === "mensual" ? "M" : "Q",
        })),
      );
      setRegistros(porFecha);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /**
   * Manda el parte entero en una sola llamada: la base lo valida (plazas,
   * chofer, fecha) y lo escribe de forma transaccional. Reenviarlo
   * reemplaza al anterior de esa furgoneta y ese día.
   */
  const enviarParte = useCallback(
    async (fecha, vehiculoId, parte) => {
      const lineas = Object.entries(parte.horasRoles ?? {}).map(([trabajadorId, v]) => ({
        trabajador_id: trabajadorId,
        rol: trabajadorId === parte.chofer ? "chofer" : "pasajero",
        // El encargado a bordo se marca a mano y es opcional: viaja con la
        // persona, no en la cabecera, para no cambiar la firma de la función.
        es_encargado: trabajadorId === parte.encargado,
        horas: Number(v.horas) || 0,
        destajo: Number(v.destajo) || 0,
      }));

      await supabase
        .rpc("enviar_parte", {
          p_fecha: fecha,
          p_vehiculo: vehiculoId,
          p_chofer: parte.chofer,
          p_jornadas: lineas,
          p_temporales: (parte.temporales ?? []).map((t) => ({
            nombre: t.nombre,
            horas: Number(t.horas) || 0,
            destajo: Number(t.destajo) || 0,
          })),
        })
        .then(ok);

      await recargar();
    },
    [recargar],
  );

  /**
   * Rellena un campo que se quedó en cero de una jornada ya registrada. Es el
   * caso del destajo que se sabe días después: se apunta 0 porque todavía no
   * hay precio, y se completa cuando lo hay, en el día que se trabajó.
   *
   * No reenvía el parte: la base solo sube lo que vale 0, de alguien que ya
   * está dentro, y solo si el parte lo registró quien está pidiendo el cambio.
   */
  const completarJornada = useCallback(
    async (fecha, vehiculoId, trabajadorId, horas, destajo) => {
      await supabase
        .rpc("completar_jornada", {
          p_fecha: fecha,
          p_vehiculo: vehiculoId,
          p_trabajador: trabajadorId,
          p_horas: Number(horas) || 0,
          p_destajo: Number(destajo) || 0,
        })
        .then(ok);

      await recargar();
    },
    [recargar],
  );

  return useMemo(
    () => ({
      vehiculos,
      personas,
      registros,
      cargando,
      error,
      enviarParte,
      completarJornada,
      recargar,
    }),
    [vehiculos, personas, registros, cargando, error, enviarParte, completarJornada, recargar],
  );
}
