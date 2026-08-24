/**
 * Comprobación de la lógica de dinero. Sin framework: `node scripts/test-calculos.mjs`.
 * Si alguna fórmula cambia (horas·tarifa + destajo − adelantos), esto falla.
 */
import assert from "node:assert/strict";

import {
  calcEmpleado,
  calcVehiculo,
  importeJornada,
  rosterToList,
  saldoEmpleado,
} from "../src/lib/calculos.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ddmm, eur } from "../src/lib/format.js";

const state = {
  jornadas: [
    {
      id: "j1",
      empleado_id: "t1",
      horas: 8,
      tarifa: 9.5,
      destajo: 0,
      fue_liquidado: false,
    },
    {
      id: "j2",
      empleado_id: "t1",
      horas: 4,
      tarifa: 9.5,
      destajo: 12,
      fue_liquidado: false,
    },
    {
      id: "j3",
      empleado_id: "t1",
      horas: 8,
      tarifa: 9.5,
      destajo: 0,
      fue_liquidado: true,
    },
    {
      id: "j4",
      empleado_id: "t2",
      horas: 5,
      tarifa: 8,
      destajo: 0,
      fue_liquidado: false,
    },
  ],
  adelantos: [
    { id: "a1", empleado_id: "t1", monto: 30 },
    { id: "a2", empleado_id: "t1", monto: "20" }, // llega como texto desde el input
  ],
  plazasVehiculo: [
    { id: "d1", vehiculo_id: "v1", plazas: 6, tarifa_aplicada: 4.5 },
    { id: "d2", vehiculo_id: "v1", plazas: 5, tarifa_aplicada: 4.5 },
    { id: "d3", vehiculo_id: "v2", plazas: 4, tarifa_aplicada: 5 },
  ],
  adelantosVehiculo: [
    { id: "av1", vehiculo_id: "v1", concepto: "Espejo", monto: 40 },
  ],
};

// --- empleados ---------------------------------------------------------------
const t1 = calcEmpleado(state, "t1");
assert.equal(
  t1.jornadas.length,
  2,
  "las jornadas liquidadas no cuentan en el ciclo abierto",
);
assert.equal(t1.totalDevengado, 8 * 9.5 + (4 * 9.5 + 12)); // 76 + 50 = 126
assert.equal(
  t1.totalAdelantos,
  50,
  "los adelantos en texto deben sumarse como número",
);
assert.equal(t1.totalPagar, 76);
assert.equal(saldoEmpleado(state, "t1"), 76);

const t2 = calcEmpleado(state, "t2");
assert.equal(t2.totalPagar, 40, "sin adelantos, el saldo es lo devengado");

assert.equal(calcEmpleado(state, "inexistente").totalPagar, 0);

// --- vehículos ---------------------------------------------------------------
const v1 = calcVehiculo(state, "v1");
assert.equal(v1.totalDevengado, 6 * 4.5 + 5 * 4.5); // 49.5
assert.equal(v1.totalAdelantos, 40);
assert.equal(v1.totalPagar, 9.5);
assert.equal(calcVehiculo(state, "v2").totalPagar, 20);

// --- el ciclo se corta en su cierre ------------------------------------------
// El candado global manda: el trabajo posterior al cierre del ciclo vigente se
// registra igual, pero no se puede cobrar todavía y no debe aparecer en el
// total a pagar. Antes se sumaba todo lo pendiente sin mirar la fecha.
const conCiclo = {
  trabajadores: [
    { id: "t1", payment_period: "quincenal" },
    { id: "t2", payment_period: "mensual" },
  ],
  periodos: {
    quincenal: { inicio: "2026-03-01", fin: "2026-03-14", cerrado: true },
    mensual: { inicio: "2026-02-01", fin: "2026-02-28", cerrado: true },
  },
  jornadas: [
    // Arrastre de un ciclo anterior: sí entra.
    {
      id: "j1",
      empleado_id: "t1",
      fecha: "2026-02-20",
      horas: 8,
      tarifa: 10,
      destajo: 0,
      fue_liquidado: false,
    },
    // Dentro del ciclo vigente: entra.
    {
      id: "j2",
      empleado_id: "t1",
      fecha: "2026-03-10",
      horas: 8,
      tarifa: 10,
      destajo: 0,
      fue_liquidado: false,
    },
    // Posterior al cierre: NO entra.
    {
      id: "j3",
      empleado_id: "t1",
      fecha: "2026-03-20",
      horas: 8,
      tarifa: 10,
      destajo: 0,
      fue_liquidado: false,
    },
    // t2 es mensual: su cierre es otro, y marzo le queda fuera.
    {
      id: "j4",
      empleado_id: "t2",
      fecha: "2026-03-02",
      horas: 8,
      tarifa: 10,
      destajo: 0,
      fue_liquidado: false,
    },
  ],
  adelantos: [
    { id: "a1", empleado_id: "t1", fecha: "2026-03-05", monto: 20 },
    { id: "a2", empleado_id: "t1", fecha: "2026-03-25", monto: 500 },
  ],
  plazasVehiculo: [
    {
      id: "d1",
      vehiculo_id: "v1",
      fecha: "2026-03-10",
      plazas: 4,
      tarifa_aplicada: 5,
    },
    {
      id: "d2",
      vehiculo_id: "v1",
      fecha: "2026-03-20",
      plazas: 4,
      tarifa_aplicada: 5,
    },
  ],
  adelantosVehiculo: [
    { id: "av1", vehiculo_id: "v1", fecha: "2026-03-22", monto: 99 },
  ],
};

const c1 = calcEmpleado(conCiclo, "t1");
assert.equal(
  c1.jornadas.length,
  2,
  "la jornada posterior al cierre no se puede cobrar aún",
);
assert.equal(c1.totalDevengado, 160, "arrastre dentro, futuro fuera");
assert.equal(
  c1.totalAdelantos,
  20,
  "el adelanto posterior al cierre no se descuenta aún",
);
assert.equal(c1.totalPagar, 140);

assert.equal(
  calcEmpleado(conCiclo, "t2").totalPagar,
  0,
  "cada persona se corta por el cierre de SU tipo de pago",
);

const cv = calcVehiculo(conCiclo, "v1");
assert.equal(
  cv.totalPagar,
  20,
  "la furgoneta también se corta en el cierre quincenal",
);

// Sin períodos cargados no se filtra: la pantalla no debe parpadear a cero.
assert.equal(
  calcEmpleado({ ...conCiclo, periodos: {} }, "t1").jornadas.length,
  3,
);

// --- roster de un parte de campo ---------------------------------------------
// El encargado que además conduce aparece una sola vez, con los dos códigos.
const filas = rosterToList({
  encargado: "t1",
  chofer: "t1",
  pasajeros: [{ id: "t2", horas: 7, destajo: 0 }],
  horasRoles: { t1: { horas: 8, destajo: 3 } },
});
assert.deepEqual(
  filas,
  [
    { id: "t1", roles: ["E", "C"], horas: 8, destajo: 3 },
    { id: "t2", roles: [], horas: 7, destajo: 0 },
  ],
  "encargado+chofer se fusionan en una fila",
);

// Encargado y chofer distintos -> dos filas.
const separados = rosterToList({
  encargado: "t1",
  chofer: "t3",
  pasajeros: [],
  horasRoles: { t1: { horas: 8, destajo: 0 }, t3: { horas: 7, destajo: 0 } },
});
assert.deepEqual(
  separados.map((f) => f.roles),
  [["E"], ["C"]],
);

// Sin encargado ni chofer, sólo pasajeros.
assert.equal(
  rosterToList({ pasajeros: [{ id: "t9", horas: 5, destajo: 1 }] }).length,
  1,
);
assert.equal(rosterToList({}).length, 0);

// --- formato -----------------------------------------------------------------
assert.equal(eur(9.5), "€9.50");
assert.equal(eur(null), "€0.00");
assert.equal(ddmm("2026-08-03"), "03/08");

// --- planilla ----------------------------------------------------------------
// El documento se arma a mano con plantillas: lo que puede romperse es que
// una comilla o un `<` de un nombre se cuele como HTML, o que la tabla salga
// descuadrada. Se comprueba sobre el generador, sin navegador.
globalThis.window = { open: () => null };
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL: () => {} };
let descargado = null;
globalThis.Blob = class {
  constructor(partes) {
    descargado = partes.join("");
  }
};
globalThis.document = {
  createElement: () => ({ click() {} }),
  body: { appendChild() {}, removeChild() {} },
};
const { abrirPlanilla } = await import("../src/lib/planilla.js");

abrirPlanilla({
  titulo: "Planilla de empleados",
  subtitulo: "Quincenal · Del 16/08 al 31/08",
  columnas: ["Nombre", "Devengado", "Adelantos", "A pagar", "Firma"],
  filas: [["<Ana> & Luis", "€80.00", "€10.00", "€70.00", ""]],
  total: 70,
});

assert.ok(
  descargado.includes("&lt;Ana&gt; &amp; Luis"),
  "los nombres se escapan",
);
assert.ok(!descargado.includes("<Ana>"), "no se cuela HTML del nombre");
assert.equal(
  (descargado.match(/<th[ >]/g) || []).length,
  5,
  "una cabecera por columna",
);
assert.equal(
  (descargado.match(/<td[ >]/g) || []).length,
  5 + 3,
  "fila + total",
);
assert.ok(descargado.includes("€70.00"), "el total sale en la planilla");
assert.ok(
  descargado.includes("window.print()"),
  "el documento se manda a imprimir solo",
);

// --- la fórmula del importe está escrita dos veces ---------------------------
//
// `importeJornada()` aquí y `v_jornadas_detalle.total` en SQL (migración 0019).
// Si una cambia y la otra no, la pantalla enseña un número y el pago hace otro,
// y nadie se entera hasta que alguien cobra de menos. Esta prueba compara las
// dos: la de JavaScript ejecutándola, la de SQL leyendo la migración y
// traduciéndola a la misma cuenta.
{
  const casos = [
    {
      horas: 8,
      tarifa: 9.5,
      destajo: 0,
      horas_central: 0,
      destajo_central: 0,
      plus_chofer: 0,
    },
    {
      horas: 8,
      tarifa: 6,
      destajo: 0,
      horas_central: 0,
      destajo_central: 0,
      plus_chofer: 6,
    },
    {
      horas: 8,
      tarifa: 12,
      destajo: 0,
      horas_central: 2,
      destajo_central: 5,
      plus_chofer: 0,
    },
    {
      horas: 0,
      tarifa: 7,
      destajo: 40,
      horas_central: 0,
      destajo_central: 0,
      plus_chofer: 0,
    },
    {
      horas: 5,
      tarifa: 6.5,
      destajo: 3,
      horas_central: 1.5,
      destajo_central: 2,
      plus_chofer: 6,
    },
  ];

  // La cuenta tal como la escribe la vista, calcada a mano.
  const comoEnSql = (j) =>
    Math.round(
      ((j.horas + j.horas_central) * j.tarifa +
        j.destajo +
        j.destajo_central +
        j.plus_chofer) *
        100,
    ) / 100;

  for (const j of casos) {
    assert.equal(
      importeJornada(j),
      comoEnSql(j),
      `la fórmula de JS y la de SQL discrepan en ${JSON.stringify(j)}`,
    );
  }

  // Y que la migración siga sumando esos cinco términos: si alguien le quita
  // uno, aquí salta antes de que llegue a producción.
  // Ruta a pelo y no `new URL(...)`: unas líneas más arriba esta misma prueba
  // sustituye `globalThis.URL` por un doble para el test de la descarga.
  const sql = readFileSync(
    join(
      import.meta.dirname,
      "../../BACKEND/supabase/migrations/0019_horas_central_plus_chofer.sql",
    ),
    "utf8",
  );
  const vista = sql.slice(
    sql.indexOf("create or replace view v_jornadas_detalle"),
  );
  const total = vista.slice(vista.indexOf("round("), vista.indexOf("as total"));
  for (const termino of [
    "j.horas",
    "j.horas_central",
    "j.tarifa_hora",
    "j.destajo",
    "j.destajo_central",
    "j.plus_chofer",
  ]) {
    assert.ok(
      total.includes(termino),
      `v_jornadas_detalle.total ya no suma ${termino}`,
    );
  }
}

console.log("cálculos OK");
