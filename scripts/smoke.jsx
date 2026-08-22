/**
 * Smoke test: renderiza cada pantalla con la forma de datos que produce
 * `useEstajos` y comprueba que aparecen sus textos clave.
 *
 *   npm run smoke
 *
 * No habla con Supabase. Su valor está en el contrato: si el store deja de
 * devolver algún campo que una pantalla usa, aquí se ve. Por eso las
 * fixturas de abajo son la referencia de esa forma.
 */
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AuthProvider } from "../src/auth/AuthProvider.jsx";
import { LoginCentral } from "../src/auth/LoginCentral.jsx";
import { CampoInicio } from "../src/campo/CampoInicio.jsx";
import { NuevoRegistroWizard } from "../src/campo/NuevoRegistroWizard.jsx";
import { PinLogin } from "../src/campo/PinLogin.jsx";
import { FichaTrabajador } from "../src/central/FichaTrabajador.jsx";
import { FichaVehiculo } from "../src/central/FichaVehiculo.jsx";
import { ConfigChoferModal } from "../src/central/modals/ConfigChoferModal.jsx";
import { GenerarPinesModal } from "../src/central/modals/GenerarPinesModal.jsx";
import { NuevoTrabajadorModal } from "../src/central/modals/NuevoTrabajadorModal.jsx";
import { NuevoVehiculoModal } from "../src/central/modals/NuevoVehiculoModal.jsx";
import { TemporalesModal } from "../src/central/modals/TemporalesModal.jsx";
import { ConfigTab } from "../src/central/tabs/ConfigTab.jsx";
import { EscanearTab } from "../src/central/tabs/EscanearTab.jsx";
import { RegistrosTab } from "../src/central/tabs/RegistrosTab.jsx";
import { ReporteDiarioTab } from "../src/central/tabs/ReporteDiarioTab.jsx";
import { ResumenTab } from "../src/central/tabs/ResumenTab.jsx";
import { VehiculosTab } from "../src/central/tabs/VehiculosTab.jsx";
import { hoy } from "../src/lib/format.js";

const HOY = hoy();
const noop = () => {};

// ---------------------------------------------------------------------------
// La forma que devuelve `useEstajos`. Cambiarla aquí sin cambiarla allí (o al
// revés) hace fallar alguna pantalla, que es justo lo que se quiere detectar.
// ---------------------------------------------------------------------------
const state = {
  trabajadores: [
    {
      id: "t1",
      nombre: "Ana",
      apellido: "Encargada",
      telefono: "600 000 001",
      cuenta: "ES00 0000 0000 0000 0000",
      payment_period: "quincenal",
      tarifa_hora: 10,
      es_encargado: true,
    },
    {
      id: "t2",
      nombre: "Beto",
      apellido: "Peon",
      telefono: "600 000 002",
      cuenta: "",
      payment_period: "mensual",
      tarifa_hora: 9,
      es_encargado: false,
    },
  ],
  vehiculos: [
    {
      id: "v1",
      nombre: "Furgo A",
      matricula: "1111-AAA",
      plazas_totales: 8,
      tarifa_plaza: 5,
      propietario: "Alfa SL",
    },
  ],
  jornadas: [
    {
      id: "j1",
      empleado_id: "t1",
      fecha: HOY,
      horas: 8,
      destajo: 0,
      tarifa: 10,
      fue_liquidado: false,
      origen: "campo",
      encargado_id: "t1",
      vehiculo_id: "v1",
      chofer: false,
      pago_id: null,
      parte_id: "p1",
    },
    {
      id: "j2",
      empleado_id: "t2",
      fecha: HOY,
      horas: 6,
      destajo: 12,
      tarifa: 9,
      fue_liquidado: false,
      origen: "central",
      encargado_id: null,
      vehiculo_id: null,
      chofer: false,
      pago_id: null,
      parte_id: "p0",
    },
  ],
  adelantos: [{ id: "a1", empleado_id: "t2", fecha: HOY, monto: 20 }],
  pagos: [
    {
      id: "pg1",
      empleado_id: "t1",
      created_at: HOY,
      periodo_inicio: HOY,
      periodo_fin: HOY,
      total_pagado: 120,
      dias: [{ id: "j0", fecha: HOY, horas: 8, destajo: 0, tarifa: 10 }],
    },
  ],
  plazasVehiculo: [
    {
      id: "pv1",
      vehiculo_id: "v1",
      fecha: HOY,
      plazas: 3,
      tarifa_aplicada: 5,
      editada_manual: false,
    },
  ],
  adelantosVehiculo: [{ id: "av1", vehiculo_id: "v1", concepto: "Espejo", monto: 40 }],
  pagosVehiculo: [
    {
      id: "pv-pago",
      vehiculo_id: "v1",
      periodo_inicio: HOY,
      periodo_fin: HOY,
      total_devengado: 50,
      total_adelantos: 10,
      total_pagado: 40,
      dias: [{ id: "d1", fecha: HOY, plazas: 4, tarifa_aplicada: 5 }],
    },
  ],
  temporales: [
    {
      id: "tmp1",
      nombre_completo: "Eventual Uno",
      horas_trabajadas: 6,
      destajo: 0,
      fecha: HOY,
      vehiculo_id: "v1",
      encargado_id: "t1",
    },
  ],
  listasEmpleados: [
    {
      id: "l1",
      ciclo: "quincenal",
      periodo_inicio: HOY,
      periodo_fin: HOY,
      encargado: "Ana Encargada",
      total_monto: 120,
      items: [{ empleado_id: "t1", vehiculo_id: null, nombre: "Ana Encargada", total_pagado: 120 }],
    },
  ],
  listasFurgonetas: [],
  pinesEncargado: [
    {
      id: "t1",
      empleado_id: "t1",
      nombre: "Ana Encargada",
      ultimos: "42",
      expira_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
  ],
  tarifaChofer: 10,
  tarifaTemporal: 8,
  periodos: {
    quincenal: { inicio: HOY, fin: HOY, label: "Del 01/08 al 15/08" },
    mensual: { inicio: HOY, fin: HOY, label: "Del 01/08 al 31/08" },
  },
};

// Cualquier acción devuelve una promesa: las pantallas encadenan `.then`.
const actions = new Proxy({}, { get: () => () => Promise.resolve() });

// Datos de la app de campo (`useCampo`).
const vehiculosCampo = [{ id: "v1", nombre: "Furgo A", plazas: 8 }];
const personasCampo = [
  { id: "t1", nombre: "Ana Encargada", ciclo: "Q" },
  { id: "t2", nombre: "Beto Peon", ciclo: "M" },
];
const registrosCampo = {
  [HOY]: {
    v1: {
      encargado: "t1",
      chofer: "t2",
      pasajeros: [],
      horasRoles: { t1: { horas: 8, destajo: 0 }, t2: { horas: 8, destajo: 0 } },
    },
  },
};

const casos = [
  [
    "PinLogin",
    <AuthProvider>
      <PinLogin onOpenCentral={noop} />
    </AuthProvider>,
    ["ESTAJOS", "Introduce tu PIN de encargado", "Acceso Central"],
  ],
  [
    "LoginCentral",
    <AuthProvider>
      <LoginCentral onCancel={noop} />
    </AuthProvider>,
    ["Acceso de administrador", "Contraseña"],
  ],
  [
    "CampoInicio",
    <CampoInicio
      registrosCampo={registrosCampo}
      vehiculos={vehiculosCampo}
      personas={personasCampo}
      onLogout={noop}
      onAbrirRegistro={noop}
    />,
    ["Parte del día", "Registrar furgoneta", "Furgo A"],
  ],
  [
    "NuevoRegistroWizard",
    <NuevoRegistroWizard
      registrosCampo={{}}
      vehiculos={vehiculosCampo}
      personas={personasCampo}
      encargadoId="t1"
      onFinalizar={noop}
      onCancel={noop}
    />,
    ["Furgoneta", "Equipo", "Enviar", "Día del parte", "Elige tu furgoneta"],
  ],
  ["EscanearTab", <EscanearTab state={state} actions={actions} />, ["Buscar trabajador"]],
  [
    "ReporteDiarioTab",
    <ReporteDiarioTab state={state} actions={actions} />,
    ["Reporte Diario", "Registro Central", "Furgo A"],
  ],
  [
    "ResumenTab",
    <ResumenTab state={state} actions={actions} />,
    ["Resumen General", "Resumen Furgonetas", "Ciclo de pago", "Del 01/08 al 15/08"],
  ],
  [
    "RegistrosTab",
    <RegistrosTab state={state} actions={actions} onVerFicha={noop} />,
    ["Añadir trabajador", "Generar PIN de encargados", "••42"],
  ],
  [
    "VehiculosTab",
    <VehiculosTab state={state} actions={actions} onVerFicha={noop} />,
    ["Añadir vehículo", "Furgo A"],
  ],
  ["ConfigTab", <ConfigTab actions={actions} />, ["Cambiar contraseña"]],
  [
    "FichaTrabajador",
    <FichaTrabajador id="t1" state={state} actions={actions} onBack={noop} />,
    ["Ana", "Saldo neto", "Dar de baja"],
  ],
  [
    "FichaVehiculo",
    <FichaVehiculo id="v1" state={state} actions={actions} onBack={noop} />,
    ["Furgo A", "Tarifa/Plaza", "Nómina Actual"],
  ],
  [
    "NuevoTrabajadorModal",
    <NuevoTrabajadorModal open onClose={noop} actions={actions} />,
    ["Nuevo Trabajador", "Pago por hora"],
  ],
  [
    "NuevoVehiculoModal",
    <NuevoVehiculoModal open onClose={noop} onSave={noop} />,
    ["Nuevo Vehículo", "Tarifa por plaza"],
  ],
  [
    "TemporalesModal",
    <TemporalesModal open onClose={noop} state={state} actions={actions} />,
    ["Ver temporales", "Tarifa de temporales", "Eventual Uno"],
  ],
  [
    "ConfigChoferModal",
    <ConfigChoferModal open onClose={noop} state={state} actions={actions} />,
    ["Configurar chofer"],
  ],
  [
    "GenerarPinesModal",
    <GenerarPinesModal open onClose={noop} state={state} actions={actions} />,
    ["Generar PIN de encargados", "PINs activos", "••42", "Ana"],
  ],
];

let fallos = 0;
for (const [nombre, elemento, textos] of casos) {
  try {
    const html = renderToStaticMarkup(elemento);
    for (const texto of textos) {
      assert.ok(html.includes(texto), `falta "${texto}"`);
    }
    // Un componente cuyo nombre se renombró a una variable corta se cuela como
    // etiqueta HTML desconocida (pasó con `<n/>` y `<e/>` en primitives.jsx: el
    // icono desaparecía sin romper nada). Cualquier etiqueta de 1-2 letras que
    // no sea HTML real es ese bug.
    const HTML_CORTAS = new Set(
      "a b i p q s u br dd dl dt em h1 h2 h3 h4 h5 h6 hr li ol rp rt td th tr ul".split(" "),
    );
    for (const [, etiqueta] of html.matchAll(/<([a-z][a-z0-9]?)[\s/>]/g)) {
      assert.ok(HTML_CORTAS.has(etiqueta), `etiqueta desconocida <${etiqueta}>`);
    }
    // Ningún PIN en claro debe llegar nunca a una pantalla de listado.
    if (nombre === "GenerarPinesModal" || nombre === "RegistrosTab") {
      assert.ok(!/\b\d{4}\b(?![-/])/.test(html.replace(/\d{4}-\d{2}-\d{2}/g, "")), "PIN en claro");
    }
    console.log(`ok   ${nombre}`);
  } catch (err) {
    fallos++;
    console.log(`FAIL ${nombre}: ${err.message}`);
  }
}

console.log(fallos === 0 ? `\n${casos.length} pantallas OK` : `\n${fallos} fallo(s)`);
process.exit(fallos === 0 ? 0 : 1);
