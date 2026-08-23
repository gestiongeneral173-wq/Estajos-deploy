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
    (total, j) => total + j.horas * j.tarifa + Number(j.destajo),
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
