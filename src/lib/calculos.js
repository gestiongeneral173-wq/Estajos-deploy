/**
 * Toda la aritmética de dinero de la app. Una jornada vale
 * `horas * tarifa + destajo`; un día de furgoneta vale `plazas * tarifa_aplicada`.
 * Los adelantos se restan del devengado del ciclo.
 */

/**
 * Convierte el roster de un parte de campo (encargado / chofer / pasajeros) en
 * una lista plana de filas con sus códigos de rol, sin repetir personas.
 */
export function rosterToList(roster) {
  const filas = [];
  const vistos = new Set();

  // Sin jornada no hay fila: el encargado a bordo siempre la tiene, pero en los
  // partes viejos `encargado` era quien registraba, que podía no ir en la
  // furgoneta — y salía una fila fantasma con las horas en blanco.
  if (roster.encargado && roster.horasRoles?.[roster.encargado]) {
    const roles = ["E"];
    // Una misma persona puede ser encargado y chofer a la vez.
    if (roster.chofer === roster.encargado) roles.push("C");
    filas.push({
      id: roster.encargado,
      roles,
      ...roster.horasRoles?.[roster.encargado],
    });
    vistos.add(roster.encargado);
  }

  if (roster.chofer && !vistos.has(roster.chofer)) {
    filas.push({
      id: roster.chofer,
      roles: ["C"],
      ...roster.horasRoles?.[roster.chofer],
    });
    vistos.add(roster.chofer);
  }

  for (const pasajero of roster.pasajeros || []) {
    filas.push({
      id: pasajero.id,
      roles: [],
      horas: pasajero.horas,
      destajo: pasajero.destajo,
    });
  }

  return filas;
}

/**
 * Cierre del ciclo vigente para ese tipo de pago: el último día que se puede
 * cobrar hoy. Lo decide el candado global de la base (`ciclo_vigente`), no la
 * fecha de hoy, así que el trabajo de ciclos posteriores queda fuera mientras
 * el viejo siga sin confirmarse. Las fechas son ISO, así que se comparan como
 * texto. Sin períodos cargados todavía no se filtra nada.
 */
const cierreDeCiclo = (state, ciclo) => state.periodos?.[ciclo]?.fin || "";

const hastaElCierre = (cierre) => (fecha) =>
  !cierre || !fecha || fecha <= cierre;

/** Ciclo abierto de un empleado: lo devengado sin liquidar menos sus adelantos. */
/**
 * Lo que vale un día de trabajo. GEMELA de `v_jornadas_detalle.total` en SQL
 * (migración 0019) — si una cambia, la otra también, o la pantalla dirá un
 * número y el pago otro. `scripts/test-calculos.mjs` compara las dos.
 *
 *   (horas fichadas + horas que añadió Central) × tarifa
 *   + destajo + destajo de Central
 *   + plus por conducir
 */
export function importeJornada(j) {
  const horas = Number(j.horas || 0) + Number(j.horas_central || 0);
  const destajo = Number(j.destajo || 0) + Number(j.destajo_central || 0);
  return (
    Math.round(
      (horas * Number(j.tarifa || 0) + destajo + Number(j.plus_chofer || 0)) *
        100,
    ) / 100
  );
}

/**
 * Lo que cobra un temporal por un día: sus horas a SU tarifa (la que se le
 * copió al crearlo, no la de configuración) más su destajo. No hay gemela en
 * SQL: la base no le paga al temporal, sólo le cobra el asiento a la
 * furgoneta. Este número es lo que Central enseña para saber qué darle.
 */
export function importeTemporal(t) {
  return (
    Math.round(
      (Number(t.horas_trabajadas || 0) * Number(t.tarifa_hora || 0) +
        Number(t.destajo || 0)) *
        100,
    ) / 100
  );
}

export function calcEmpleado(state, empleadoId) {
  const trabajador = state.trabajadores?.find((t) => t.id === empleadoId);
  const dentro = hastaElCierre(
    cierreDeCiclo(state, trabajador?.payment_period ?? "quincenal"),
  );
  const jornadas = state.jornadas.filter(
    (j) => j.empleado_id === empleadoId && !j.fue_liquidado && dentro(j.fecha),
  );
  const adelantos = state.adelantos.filter(
    (a) => a.empleado_id === empleadoId && dentro(a.fecha),
  );
  const totalDevengado = jornadas.reduce(
    (total, j) => total + importeJornada(j),
    0,
  );
  const totalAdelantos = adelantos.reduce(
    (total, a) => total + Number(a.monto),
    0,
  );

  return {
    jornadas,
    adelantos,
    totalDevengado,
    totalAdelantos,
    totalPagar: totalDevengado - totalAdelantos,
  };
}

/**
 * "Pendiente" / "pagado" / "sin_movimientos" — no dos, tres. Un alta de hoy
 * que nunca ha trabajado no es lo mismo que alguien que ya cobró, y antes la
 * pantalla los confundía: los dos salían con la misma insignia verde.
 *
 * Emparejar por `periodo_fin`, no por `periodo_inicio`: cuando alguien
 * arrastra días de un ciclo anterior, `liquidar_trabajador` retrasa el inicio
 * del pago hasta el más viejo de esos días — el inicio deja de coincidir con
 * el ciclo, pero el fin es siempre exactamente el cierre.
 */
export function estadoPago(state, empleadoId) {
  const pend = calcEmpleado(state, empleadoId);
  if (pend.jornadas.length > 0 || pend.adelantos.length > 0) return "pendiente";

  const trabajador = state.trabajadores?.find((t) => t.id === empleadoId);
  const finVigente =
    state.periodos?.[trabajador?.payment_period ?? "quincenal"]?.fin;
  const pagado =
    !!finVigente &&
    (state.pagos ?? []).some(
      (pago) =>
        pago.empleado_id === empleadoId && pago.periodo_fin === finVigente,
    );
  return pagado ? "pagado" : "sin_movimientos";
}

export function saldoEmpleado(state, empleadoId) {
  return calcEmpleado(state, empleadoId).totalPagar;
}

/** Ciclo abierto de una furgoneta: plazas transportadas menos adelantos/reparaciones. */
export function calcVehiculo(state, vehiculoId) {
  // Las furgonetas sólo tienen ciclo quincenal.
  const dentro = hastaElCierre(cierreDeCiclo(state, "quincenal"));
  const dias = state.plazasVehiculo.filter(
    (d) => d.vehiculo_id === vehiculoId && dentro(d.fecha),
  );
  const adelantos = state.adelantosVehiculo.filter(
    (a) => a.vehiculo_id === vehiculoId && dentro(a.fecha),
  );
  const totalDevengado = dias.reduce(
    (total, d) => total + d.plazas * d.tarifa_aplicada,
    0,
  );
  const totalAdelantos = adelantos.reduce(
    (total, a) => total + Number(a.monto),
    0,
  );

  return {
    dias,
    adelantos,
    totalDevengado,
    totalAdelantos,
    totalPagar: totalDevengado - totalAdelantos,
  };
}
