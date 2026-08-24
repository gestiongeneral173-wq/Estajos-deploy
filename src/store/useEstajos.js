import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ok, supabase } from "../lib/supabase.js";

/**
 * Estado de Central contra Supabase.
 *
 * Mantiene a propósito la misma forma `{ state, actions }` que tenía la
 * versión en memoria, para que las pantallas no sepan de dónde vienen los
 * datos. Toda la traducción entre el esquema de la base y lo que las
 * pantallas esperan vive aquí:
 *
 *   base                        pantallas
 *   ────────────────────────    ─────────────────────────────
 *   jornadas.trabajador_id      jornada.empleado_id
 *   jornadas.pago_id is null    jornada.fue_liquidado
 *   jornadas.rol = 'chofer'     jornada.chofer
 *   adelantos (uno solo)        adelantos / adelantosVehiculo
 *   pagos (uno solo)            pagos / pagosVehiculo
 *
 * ponytail: cada acción recarga todo el estado en lugar de parchearlo. Con
 * el volumen de una empresa de furgonetas (cientos de filas por ciclo) es
 * una consulta de milisegundos y evita toda una clase de bugs de caché
 * desincronizada. Si algún día pesa, lo que toca es paginar por período,
 * no llevar un caché a mano.
 */

const ESTADO_VACIO = {
  trabajadores: [],
  vehiculos: [],
  jornadas: [],
  adelantos: [],
  pagos: [],
  plazasVehiculo: [],
  adelantosVehiculo: [],
  pagosVehiculo: [],
  temporales: [],
  trabajadoresBaja: [],
  listasEmpleados: [],
  listasFurgonetas: [],
  pinesEncargado: [],
  tarifaChofer: 0,
  tarifaTemporal: 0,
  // El ciclo vigente de cada tipo de pago, tal como lo decide el candado global
  // de la base (`ciclo_vigente`). `cerrado` dice si ya pasó su último día, que
  // es cuando se puede empezar a cobrar.
  periodos: {
    quincenal: { inicio: "", fin: "", label: "", cerrado: false },
    mensual: { inicio: "", fin: "", label: "", cerrado: false },
  },
};

// Sólo estas columnas se envían al actualizar: los formularios arrastran
// campos calculados (balance, pin, nombre completo…) que no son columnas.
const COLUMNAS_TRABAJADOR = [
  "nombre",
  "apellido",
  "telefono",
  "cuenta",
  "payment_period",
  "tarifa_hora",
  "es_encargado",
];
const COLUMNAS_VEHICULO = [
  "nombre",
  "matricula",
  "plazas_totales",
  "tarifa_plaza",
  "propietario",
];

// `org_id` nunca se envía desde el cliente: lo pone el disparador
// `fijar_org()` a partir de la sesión. Enviarlo sería, además, inútil.
const soloColumnas = (obj, columnas) =>
  Object.fromEntries(
    columnas.filter((c) => obj[c] !== undefined).map((c) => [c, obj[c]]),
  );

const numero = (v) =>
  v === "" || v === null || v === undefined ? 0 : Number(v);
const ddmm = (f) => (f ? `${f.slice(8, 10)}/${f.slice(5, 7)}` : "");

export function useEstajos() {
  const [state, setState] = useState(ESTADO_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const recargar = useCallback(async () => {
    try {
      const [
        trabajadores,
        vehiculos,
        jornadas,
        adelantos,
        pagos,
        plazas,
        temporales,
        listas,
        pines,
        ajustes,
        periodos,
        bajas,
      ] = await Promise.all([
        supabase
          .from("trabajadores")
          .select(
            "id, nombre, apellido, telefono, cuenta, payment_period, payment_period_pendiente, tarifa_hora, es_encargado",
          )
          .eq("activo", true)
          .order("nombre")
          .then(ok),
        supabase
          .from("vehiculos")
          .select(
            "id, nombre, matricula, plazas_totales, tarifa_plaza, propietario",
          )
          .eq("activo", true)
          .order("nombre")
          .then(ok),
        supabase
          .from("v_jornadas_detalle")
          .select(
            "id, trabajador_id, fecha, horas, destajo, horas_central, destajo_central, plus_chofer, tarifa_hora, rol, origen, encargado_id, registrado_por, vehiculo_id, pago_id, parte_id",
          )
          .order("fecha", { ascending: false })
          .then(ok),
        supabase
          .from("adelantos")
          .select(
            "id, trabajador_id, vehiculo_id, fecha, monto, concepto, pago_id",
          )
          .order("fecha")
          .then(ok),
        supabase
          .from("pagos")
          .select(
            "id, trabajador_id, vehiculo_id, ciclo, periodo_inicio, periodo_fin, total_devengado, total_adelantos, neto, pagado_at",
          )
          .order("pagado_at", { ascending: false })
          .then(ok),
        supabase
          .from("plazas_vehiculo")
          .select(
            "id, vehiculo_id, fecha, plazas, tarifa_aplicada, editada_manual, pago_id",
          )
          .order("fecha")
          .then(ok),
        supabase
          .from("temporales")
          .select(
            "id, nombre, horas, destajo, tarifa_hora, partes(fecha, vehiculo_id, encargado_id)",
          )
          .then(ok),
        supabase
          .from("listas_pago")
          .select(
            "id, tipo, ciclo, periodo_inicio, periodo_fin, encargado, total, estado, listas_pago_items(trabajador_id, vehiculo_id, nombre, monto)",
          )
          .neq("estado", "cancelada")
          .eq("oculta", false)
          .order("creado_at", { ascending: false })
          .then(ok),
        supabase.rpc("pines_activos").then(ok),
        supabase
          .from("ajustes")
          .select("tarifa_chofer, tarifa_temporal")
          .maybeSingle()
          .then(ok),
        supabase.rpc("periodos_activos").then(ok),
        // Los de baja sólo se piden para poder ponerles nombre donde salgan
        // como encargados de un parte viejo: sin esto quedaba un "—".
        supabase
          .from("trabajadores")
          .select("id, nombre, apellido")
          .eq("activo", false)
          .then(ok),
      ]);

      // --- jornadas ------------------------------------------------------
      const jornadasUi = jornadas.map((j) => ({
        id: j.id,
        empleado_id: j.trabajador_id,
        fecha: j.fecha,
        horas: Number(j.horas),
        destajo: Number(j.destajo),
        // Lo que Central añadió encima, aparte para poder enseñarlo como "10+2".
        horas_central: Number(j.horas_central || 0),
        destajo_central: Number(j.destajo_central || 0),
        plus_chofer: Number(j.plus_chofer || 0),
        tarifa: Number(j.tarifa_hora),
        fue_liquidado: j.pago_id !== null,
        origen: j.origen,
        encargado_id: j.encargado_id,
        registrado_por: j.registrado_por,
        vehiculo_id: j.vehiculo_id,
        chofer: j.rol === "chofer",
        pago_id: j.pago_id,
        parte_id: j.parte_id,
      }));

      // --- adelantos: la base los tiene en una tabla, la UI en dos --------
      const pendientes = adelantos.filter((a) => a.pago_id === null);
      const adelantosUi = pendientes
        .filter((a) => a.trabajador_id)
        .map((a) => ({
          id: a.id,
          empleado_id: a.trabajador_id,
          fecha: a.fecha,
          monto: Number(a.monto),
        }));
      const adelantosVehiculoUi = pendientes
        .filter((a) => a.vehiculo_id)
        .map((a) => ({
          id: a.id,
          vehiculo_id: a.vehiculo_id,
          fecha: a.fecha,
          concepto: a.concepto ?? "",
          monto: Number(a.monto),
        }));

      // --- pagos: el detalle se reconstruye por pago_id --------------------
      const diasPorPago = new Map();
      for (const j of jornadasUi) {
        if (!j.pago_id) continue;
        if (!diasPorPago.has(j.pago_id)) diasPorPago.set(j.pago_id, []);
        diasPorPago.get(j.pago_id).push({
          id: j.id,
          fecha: j.fecha,
          horas: j.horas,
          destajo: j.destajo,
          tarifa: j.tarifa,
        });
      }
      const plazasPorPago = new Map();
      for (const p of plazas) {
        if (!p.pago_id) continue;
        if (!plazasPorPago.has(p.pago_id)) plazasPorPago.set(p.pago_id, []);
        plazasPorPago.get(p.pago_id).push({
          id: p.id,
          fecha: p.fecha,
          plazas: p.plazas,
          tarifa_aplicada: Number(p.tarifa_aplicada),
        });
      }

      const pagosUi = pagos
        .filter((p) => p.trabajador_id)
        .map((p) => ({
          id: p.id,
          empleado_id: p.trabajador_id,
          created_at: p.pagado_at?.slice(0, 10) ?? "",
          periodo_inicio: p.periodo_inicio,
          periodo_fin: p.periodo_fin,
          total_pagado: Number(p.neto),
          dias: diasPorPago.get(p.id) ?? [],
        }));

      const pagosVehiculoUi = pagos
        .filter((p) => p.vehiculo_id)
        .map((p) => ({
          id: p.id,
          vehiculo_id: p.vehiculo_id,
          periodo_inicio: p.periodo_inicio,
          periodo_fin: p.periodo_fin,
          total_devengado: Number(p.total_devengado),
          total_adelantos: Number(p.total_adelantos),
          total_pagado: Number(p.neto),
          dias: plazasPorPago.get(p.id) ?? [],
        }));

      // --- resto -----------------------------------------------------------
      const listasUi = (tipo) =>
        listas
          .filter((l) => l.tipo === tipo)
          .map((l) => ({
            id: l.id,
            ciclo: l.ciclo,
            periodo_inicio: l.periodo_inicio,
            periodo_fin: l.periodo_fin,
            encargado: l.encargado,
            total_monto: Number(l.total),
            items: (l.listas_pago_items ?? []).map((i) => ({
              empleado_id: i.trabajador_id,
              vehiculo_id: i.vehiculo_id,
              nombre: i.nombre,
              total_pagado: Number(i.monto),
            })),
          }));

      const periodosUi = Object.fromEntries(
        (periodos ?? []).map((p) => [
          p.ciclo,
          {
            inicio: p.inicio,
            fin: p.fin,
            cerrado: p.cerrado,
            label: `Del ${ddmm(p.inicio)} al ${ddmm(p.fin)}`,
          },
        ]),
      );

      if (!montado.current) return;
      setState({
        trabajadores: trabajadores.map((t) => ({
          ...t,
          tarifa_hora: Number(t.tarifa_hora),
        })),
        vehiculos: vehiculos.map((v) => ({
          ...v,
          tarifa_plaza: Number(v.tarifa_plaza),
        })),
        jornadas: jornadasUi,
        adelantos: adelantosUi,
        pagos: pagosUi,
        plazasVehiculo: plazas
          .filter((p) => p.pago_id === null)
          .map((p) => ({
            id: p.id,
            vehiculo_id: p.vehiculo_id,
            fecha: p.fecha,
            plazas: p.plazas,
            tarifa_aplicada: Number(p.tarifa_aplicada),
            editada_manual: p.editada_manual,
          })),
        adelantosVehiculo: adelantosVehiculoUi,
        pagosVehiculo: pagosVehiculoUi,
        temporales: temporales.map((t) => ({
          id: t.id,
          nombre_completo: t.nombre,
          horas_trabajadas: Number(t.horas),
          destajo: Number(t.destajo),
          // La tarifa se copia al crear el temporal; a partir de ahí es suya y
          // se puede corregir sin tocar la de configuración.
          tarifa_hora: Number(t.tarifa_hora),
          fecha: t.partes?.fecha ?? null,
          vehiculo_id: t.partes?.vehiculo_id ?? null,
          encargado_id: t.partes?.encargado_id ?? null,
        })),
        trabajadoresBaja: bajas.map((t) => ({ ...t, de_baja: true })),
        listasEmpleados: listasUi("empleado"),
        listasFurgonetas: listasUi("furgoneta"),
        pinesEncargado: (pines ?? []).map((p) => ({
          id: p.trabajador_id,
          empleado_id: p.trabajador_id,
          nombre: p.nombre,
          ultimos: p.ultimos,
          expira_at: p.expira_at,
        })),
        tarifaChofer: Number(ajustes?.tarifa_chofer ?? 0),
        tarifaTemporal: Number(ajustes?.tarifa_temporal ?? 0),
        periodos: { ...ESTADO_VACIO.periodos, ...periodosUi },
      });
      setError(null);
    } catch (e) {
      if (montado.current) setError(e.message);
    } finally {
      if (montado.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const actions = useMemo(() => {
    // Envuelve una mutación: la ejecuta, recarga y deja el error a la vista.
    const mutar = async (fn) => {
      try {
        const r = await fn();
        await recargar();
        return r;
      } catch (e) {
        setError(e.message);
        throw e;
      }
    };

    const rpc = (nombre, args) =>
      mutar(() => supabase.rpc(nombre, args).then(ok));

    return {
      // ---- Trabajadores --------------------------------------------------
      crearTrabajador: (datos) =>
        mutar(() =>
          supabase
            .from("trabajadores")
            .insert(soloColumnas(datos, COLUMNAS_TRABAJADOR))
            .then(ok),
        ),

      actualizarTrabajador: (id, cambios) =>
        mutar(() =>
          supabase
            .from("trabajadores")
            .update(soloColumnas(cambios, COLUMNAS_TRABAJADOR))
            .eq("id", id)
            .then(ok),
        ),

      darDeBajaTrabajador: (id) => rpc("dar_baja_trabajador", { p_id: id }),

      // ---- PINs -----------------------------------------------------------
      // Devuelve los PINs en claro: es la única vez que se pueden ver.
      generarPinesEncargado: (empleadoIds) =>
        mutar(async () => {
          const generados = [];
          for (const id of empleadoIds) {
            const pin = await supabase
              .rpc("generar_pin", { p_trabajador: id })
              .then(ok);
            generados.push({ empleado_id: id, pin });
          }
          return generados;
        }),

      eliminarPinEncargado: (empleadoId) =>
        rpc("revocar_pin", { p_trabajador: empleadoId }),

      // ---- Adelantos -------------------------------------------------------
      // La fecha decide en qué ciclo cae el descuento, así que se puede
      // elegir: un adelanto entregado el día 28 y anotado el 2 pertenece al
      // ciclo del 28, no al del 2.
      registrarAdelanto: (empleadoId, monto, fecha) =>
        mutar(() =>
          supabase
            .from("adelantos")
            .insert({
              trabajador_id: empleadoId,
              monto: numero(monto),
              fecha: fecha || undefined,
            })
            .then(ok),
        ),

      editarAdelanto: (id, monto) =>
        mutar(() =>
          supabase
            .from("adelantos")
            .update({ monto: numero(monto) })
            .eq("id", id)
            .then(ok),
        ),

      eliminarAdelanto: (id) =>
        mutar(() => supabase.from("adelantos").delete().eq("id", id).then(ok)),

      // ---- Jornadas ---------------------------------------------------------
      registrarHorasCentral: (empleadoId, horas, destajo, fecha) =>
        rpc("registrar_horas_central", {
          p_trabajador: empleadoId,
          p_fecha: fecha ?? new Date().toISOString().slice(0, 10),
          p_horas: numero(horas),
          p_destajo: numero(destajo),
        }),

      editarJornada: (id, { horas, destajo }) =>
        mutar(() =>
          supabase
            .from("jornadas")
            .update({ horas: numero(horas), destajo: numero(destajo) })
            .eq("id", id)
            .then(ok),
        ),

      // Ya no borra contra la tabla: la función decide si borrar u ocultar
      // (según esté pagada) y recuenta las plazas de la furgoneta afectada.
      eliminarJornadas: (ids) => rpc("borrar_jornadas", { p_ids: ids }),

      // Qué tiene esa persona ese día, antes de que el admin rellene nada.
      estadoJornada: (empleadoId, fecha) =>
        supabase
          .rpc("estado_jornada", { p_trabajador: empleadoId, p_fecha: fecha })
          .then(ok)
          .then((filas) => filas?.[0] ?? null),

      // ---- Liquidaciones -----------------------------------------------------
      pagarEmpleado: (id) => rpc("liquidar_trabajador", { p_trabajador: id }),

      generarListaEmpleados: ({
        encargado,
        empleadoIds,
        ciclo = "quincenal",
      }) =>
        rpc("generar_lista", {
          p_tipo: "empleado",
          p_ciclo: ciclo,
          p_encargado: encargado,
          p_ids: empleadoIds,
        }),

      cancelarListaEmpleados: (id) => rpc("cancelar_lista", { p_lista: id }),

      // Una lista de un ciclo ya confirmado no se puede cancelar (haría
      // reaparecer un ciclo cerrado): sólo se quita de la vista.
      ocultarLista: (id) => rpc("ocultar_lista", { p_lista: id }),

      // Llegar a saldo cero no hace avanzar el ciclo: hace falta confirmarlo.
      confirmarCiclo: (ciclo) => rpc("confirmar_ciclo", { p_ciclo: ciclo }),

      // ---- Vehículos -----------------------------------------------------------
      crearVehiculo: (datos) =>
        mutar(() =>
          supabase
            .from("vehiculos")
            .insert(soloColumnas(datos, COLUMNAS_VEHICULO))
            .then(ok),
        ),

      actualizarVehiculo: (id, cambios) =>
        mutar(() =>
          supabase
            .from("vehiculos")
            .update(soloColumnas(cambios, COLUMNAS_VEHICULO))
            .eq("id", id)
            .then(ok),
        ),

      // Sin `p_forzar` la base se niega si la furgoneta aún tiene jornadas de
      // empleados sin liquidar; la pantalla lo vuelve a pedir confirmado.
      darDeBajaVehiculo: (id, forzar = false) =>
        rpc("dar_baja_vehiculo", { p_id: id, p_forzar: forzar }),

      registrarAdelantoVehiculo: (vehiculoId, concepto, monto, fecha) =>
        mutar(() =>
          supabase
            .from("adelantos")
            .insert({
              vehiculo_id: vehiculoId,
              concepto: concepto || null,
              monto: numero(monto),
              fecha: fecha || undefined,
            })
            .then(ok),
        ),

      editarAdelantoVehiculo: (id, monto) =>
        mutar(() =>
          supabase
            .from("adelantos")
            .update({ monto: numero(monto) })
            .eq("id", id)
            .then(ok),
        ),

      eliminarAdelantoVehiculo: (id) =>
        mutar(() => supabase.from("adelantos").delete().eq("id", id).then(ok)),

      editarPlazasDia: (id, plazas) =>
        rpc("editar_plazas_dia", {
          p_id: id,
          p_plazas: Math.max(0, Math.trunc(numero(plazas))),
        }),

      pagarVehiculo: (id) => rpc("liquidar_vehiculo", { p_vehiculo: id }),

      generarListaFurgonetas: ({ encargado, vehiculoIds }) =>
        rpc("generar_lista", {
          p_tipo: "furgoneta",
          p_ciclo: "quincenal",
          p_encargado: encargado,
          p_ids: vehiculoIds,
        }),

      cancelarListaFurgonetas: (id) => rpc("cancelar_lista", { p_lista: id }),

      // ---- Temporales y tarifas -------------------------------------------------
      eliminarTemporal: (id) =>
        mutar(() => supabase.from("temporales").delete().eq("id", id).then(ok)),

      editarTarifaTemporal: (id, tarifa) =>
        mutar(() =>
          supabase
            .from("temporales")
            .update({ tarifa_hora: numero(tarifa) })
            .eq("id", id)
            .then(ok),
        ),

      eliminarTodosLosTemporales: () =>
        mutar(() =>
          supabase.from("temporales").delete().not("id", "is", null).then(ok),
        ),

      // Se pasa por `set_tarifas` en vez de por un UPDATE directo: si la
      // organización aún no tiene fila en `ajustes`, el UPDATE no tocaba
      // ninguna fila, PostgREST devolvía 204 y la tarifa se quedaba en 0,00
      // sin un solo aviso. La función hace upsert y falla en voz alta.
      setTarifaChofer: (v) => rpc("set_tarifas", { p_chofer: numero(v) }),

      setTarifaTemporal: (v) => rpc("set_tarifas", { p_temporal: numero(v) }),

      // ---- Corte de emergencia ---------------------------------------------
      // `activar_panico` retira los permisos de la base: no tiene sentido
      // recargar el estado después, porque ya no hay estado que leer.
      activarPanico: (password) =>
        supabase.rpc("activar_panico", { p_password: password }).then(ok),

      cambiarPasswordPanico: (actual, nueva) =>
        supabase
          .rpc("cambiar_password_panico", { p_actual: actual, p_nueva: nueva })
          .then(ok),

      cambiarPassword: async (password) => {
        const { error: e } = await supabase.auth.updateUser({ password });
        if (e) throw new Error(e.message);
      },

      recargar,
      limpiarError: () => setError(null),
    };
  }, [recargar]);

  return { state, actions, cargando, error };
}
