import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  Trash2,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { CodeBadge } from "../../components/ui/Badges.jsx";
import {
  Button,
  Card,
  Input,
  SectionTitle,
  StatCard,
} from "../../components/ui/primitives.jsx";
import { calcEmpleado, calcVehiculo } from "../../lib/calculos.js";
import { descargarCSV } from "../../lib/csv.js";
import { ddmm, eur } from "../../lib/format.js";
import { abrirPlanilla } from "../../lib/planilla.js";
import { colors, hexToRgba } from "../../theme.js";

export function ResumenTab({ state, actions }) {
  const { trabajadores, vehiculos } = state,
    totalPorCiclo = (u) =>
      trabajadores
        .filter((trabajador) => trabajador.payment_period === u)
        .reduce((x, h) => x + calcEmpleado(state, h.id).totalPagar, 0),
    totalVehiculos = vehiculos.reduce(
      (u, vehiculo) => u + calcVehiculo(state, vehiculo.id).totalPagar,
      0,
    ),
    fondos = {
      quincenal: hexToRgba("#6E7370", 0.08),
      mensual: hexToRgba("#3C403E", 0.08),
    },
    textos = {
      quincenal: "#6E7370",
      mensual: "#3C403E",
    };
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <SectionTitle color="gold">Resumen General</SectionTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div
            className="rounded-lg px-3 py-2"
            style={{
              background: fondos.quincenal,
            }}
          >
            <p
              className="eyebrow opacity-70"
              style={{
                color: textos.quincenal,
              }}
            >
              Quincenal
            </p>
            <p
              className="text-xs font-semibold"
              style={{
                color: textos.quincenal,
              }}
            >
              {state.periodos.quincenal.label}
            </p>
          </div>
          <div
            className="rounded-lg px-3 py-2"
            style={{
              background: fondos.mensual,
            }}
          >
            <p
              className="eyebrow opacity-70"
              style={{
                color: textos.mensual,
              }}
            >
              Mensual
            </p>
            <p
              className="text-xs font-semibold"
              style={{
                color: textos.mensual,
              }}
            >
              {state.periodos.mensual.label}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={`€${totalPorCiclo("quincenal").toFixed(2)}`}
            label="Quincenales"
            color="gold"
          />
          <StatCard
            value={`€${totalPorCiclo("mensual").toFixed(2)}`}
            label="Mensuales"
            color="navy"
          />
        </div>
      </Card>
      <Card
        onClick={() => setAbierto((v) => !v)}
        className="cursor-pointer select-none"
      >
        <div className="flex items-center justify-between mb-4">
          <SectionTitle color="gold" className="!mb-0">
            Resumen Furgonetas
          </SectionTitle>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${abierto ? "rotate-180" : ""}`}
            style={{
              color: colors.navyDark,
            }}
          />
        </div>
        <div
          className="rounded-lg px-3 py-2 mb-3"
          style={{
            background: fondos.quincenal,
          }}
        >
          <p
            className="eyebrow opacity-70"
            style={{
              color: textos.quincenal,
            }}
          >
            Quincenal (único ciclo de furgonetas)
          </p>
          <p
            className="text-xs font-semibold"
            style={{
              color: textos.quincenal,
            }}
          >
            {state.periodos.quincenal.label}
          </p>
        </div>
        <StatCard
          value={`€${totalVehiculos.toFixed(2)}`}
          label="Pendiente quincenal"
          color="gold"
        />
      </Card>
      {abierto && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <Truck
              className="w-3.5 h-3.5"
              style={{
                color: colors.navyDark,
              }}
            />
            <p
              className="eyebrow"
              style={{
                color: colors.navyDark,
              }}
            >
              Furgonetas
            </p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <ListasPago tipo="furgoneta" state={state} actions={actions} />
        </>
      )}
      <div className="flex items-center gap-2 pt-2">
        <Users
          className="w-3.5 h-3.5"
          style={{
            color: colors.navyDark,
          }}
        />
        <p
          className="eyebrow"
          style={{
            color: colors.navyDark,
          }}
        >
          Empleados
        </p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <ListasPago tipo="empleado" state={state} actions={actions} />
    </div>
  );
}

export function ListasPago({ tipo, state, actions }) {
  const esEmpleado = tipo === "empleado",
    { trabajadores, vehiculos, listasEmpleados, listasFurgonetas } = state,
    [ciclo, setCiclo] = useState("quincenal"),
    [fase, setFase] = useState("idle"),
    [q, setQ] = useState(""),
    [seleccion, setSeleccion] = useState(new Set()),
    [encargado, setEncargado] = useState(""),
    [listaAbierta, setListaAbierta] = useState(null),
    fuente = esEmpleado ? trabajadores : vehiculos,
    base = esEmpleado
      ? fuente.filter((A) => A.payment_period === ciclo)
      : fuente,
    calculos = useMemo(() => {
      const A = {};
      base.forEach((H) => {
        A[H.id] = esEmpleado
          ? calcEmpleado(state, H.id)
          : calcVehiculo(state, H.id);
      });
      return A;
    }, [base, state, esEmpleado]),
    filtrados = useMemo(() => {
      const A = q.trim().toLowerCase();
      return base
        .filter((H) => calculos[H.id].totalPagar > 0)
        .filter((H) => {
          const v = esEmpleado ? `${H.nombre} ${H.apellido}` : H.nombre;
          return !A || v.toLowerCase().includes(A);
        });
    }, [base, calculos, q, esEmpleado]),
    seleccionados = base.filter((A) => seleccion.has(A.id)),
    totalSeleccionado = seleccionados.reduce(
      (A, seleccionado) => A + calculos[seleccionado.id].totalPagar,
      0,
    ),
    listas = esEmpleado
      ? listasEmpleados.filter(
          (listasEmpleado) => listasEmpleado.ciclo === ciclo,
        )
      : listasFurgonetas,
    toggleSeleccion = (A) =>
      setSeleccion((H) => {
        const v = new Set(H);
        v.has(A) ? v.delete(A) : v.add(A);
        return v;
      }),
    generarLista = () => {
      if (!encargado.trim()) {
        return;
      }
      const ids = [...seleccion];
      const enviar = esEmpleado
        ? actions.generarListaEmpleados({ encargado, empleadoIds: ids, ciclo })
        : actions.generarListaFurgonetas({ encargado, vehiculoIds: ids });

      // Sólo se limpia la selección si la base aceptó la lista: si falla,
      // el usuario sigue teniendo delante lo que había elegido.
      Promise.resolve(enviar)
        .then(() => {
          setSeleccion(new Set());
          setEncargado("");
          setFase("idle");
        })
        // El aviso lo pinta CentralApp arriba del todo; desde aquí, al final
        // de la lista, no se veía y parecía que el botón no hacía nada.
        .catch(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    },
    conSaldo = base.filter((A) => calculos[A.id].totalPagar > 0),
    exportarCSV = () => {
      if (conSaldo.length === 0) {
        return;
      }
      const A = conSaldo.map((H) => [
        esEmpleado ? `${H.nombre} ${H.apellido}` : H.nombre,
        calculos[H.id].totalPagar.toFixed(2),
      ]);
      descargarCSV(`Ciclo_${esEmpleado ? "Empleados" : "Furgonetas"}.csv`, [
        ["Nombre", "A pagar (€)"],
        ...A,
      ]);
    },
    periodo = esEmpleado ? state.periodos[ciclo] : state.periodos.quincenal,
    // El papel que se firma no puede llevar la etiqueta genérica del ciclo: si
    // alguien arrastra días de un ciclo anterior, el rango real empieza antes.
    // Se toma la fecha más antigua de todo lo que se va a imprimir.
    desdeReal = conSaldo.reduce((minimo, h) => {
      const calculo = calculos[h.id],
        fechas = [
          ...(calculo.jornadas ?? calculo.dias ?? []),
          ...calculo.adelantos,
        ]
          .map((fila) => fila.fecha)
          .filter(Boolean);
      if (fechas.length === 0) {
        return minimo;
      }
      const masAntigua = fechas.reduce((a, b) => (a < b ? a : b));
      return !minimo || masAntigua < minimo ? masAntigua : minimo;
    }, null),
    exportarPlanilla = () => {
      if (conSaldo.length === 0) {
        return;
      }
      abrirPlanilla({
        titulo: esEmpleado ? "Planilla de empleados" : "Planilla de furgonetas",
        subtitulo: `${esEmpleado && ciclo === "mensual" ? "Mensual" : "Quincenal"} · Del ${ddmm(desdeReal ?? periodo.inicio)} al ${ddmm(periodo.fin)}`,
        columnas: ["Nombre", "Devengado", "Adelantos", "A pagar", "Firma"],
        filas: conSaldo.map((h) => [
          esEmpleado ? `${h.nombre} ${h.apellido}` : h.nombre,
          eur(calculos[h.id].totalDevengado),
          eur(calculos[h.id].totalAdelantos),
          eur(calculos[h.id].totalPagar),
          "",
        ]),
        total: conSaldo.reduce(
          (suma, h) => suma + calculos[h.id].totalPagar,
          0,
        ),
      });
    };
  return (
    <>
      <Card>
        <SectionTitle color="green">Ciclo de pago</SectionTitle>
        {esEmpleado ? (
          <div className="flex gap-2 mb-3">
            <Button
              variant="pill"
              active={ciclo === "quincenal"}
              onClick={() => {
                setCiclo("quincenal");
                setFase("idle");
              }}
            >
              Quincenal
            </Button>
            <Button
              variant="pill"
              active={ciclo === "mensual"}
              onClick={() => {
                setCiclo("mensual");
                setFase("idle");
              }}
            >
              Mensual
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-gray-500 mb-3">
            Las furgonetas solo tienen ciclo quincenal — no hay selector.
          </p>
        )}
        <p className="text-[11px] text-gray-500 mb-1">
          {"Período activo: "}
          {periodo.label}
          {periodo.cerrado
            ? " · cerrado, listo para pagar"
            : " · todavía en curso"}
        </p>
        {/* Llegar a saldo cero no hace avanzar el ciclo: hasta que alguien lo
            confirma, el sistema sigue pidiendo cobrar éste. Sin este botón el
            candado global se queda atascado en el primer ciclo para siempre. */}
        {periodo.cerrado && (
          <div className="mb-3">
            <Button
              variant="outline"
              icon={<Check className="w-4 h-4" />}
              onClick={() =>
                actions.confirmarCiclo(esEmpleado ? ciclo : "quincenal")
              }
            >
              Confirmar ciclo cerrado
            </Button>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Avanza al ciclo siguiente. Sólo funciona cuando no queda nadie sin
              liquidar.
            </p>
          </div>
        )}
        {/* La lista de pago reparte efectivo en mano a través de un tercero, y
            eso solo se hace en el ciclo quincenal: el mensual va por nómina,
            persona a persona desde Escanear. `generar_lista` lo rechaza en la
            base, así que para habilitarlo hay que quitar esa comprobación
            ADEMÁS de la condición `ciclo === "quincenal"` de la tarjeta de
            abajo. Sin este aviso la tarjeta desaparecía sin decir por qué. */}
        {esEmpleado && ciclo === "mensual" && (
          <p className="text-[11px] text-gray-500 mb-3">
            Las listas de pago en efectivo son solo del ciclo quincenal. A los
            mensuales se les paga desde Escanear, uno a uno.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            disabled={conSaldo.length === 0}
            onClick={exportarCSV}
          >
            Exportar a Excel
          </Button>
          <Button
            variant="dark"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            disabled={conSaldo.length === 0}
            onClick={exportarPlanilla}
          >
            Exportar planilla
          </Button>
        </div>
        {conSaldo.length === 0 && (
          <p className="mt-2 text-[11px] text-gray-500 text-center">
            sin datos para exportar
          </p>
        )}
      </Card>
      {esEmpleado && ciclo === "quincenal" && (
        <Card>
          <SectionTitle color="gold">Lista de pago quincenal</SectionTitle>
          {fase === "idle" && (
            <>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setQ("");
                  setSeleccion(new Set());
                  setFase("seleccion");
                }}
              >
                Generar lista
              </Button>
              <p className="mt-2 text-[11px] text-gray-500 text-center">
                Selecciona a los empleados con saldo pendiente y ejecuta el pago
                en efectivo.
              </p>
            </>
          )}
          {fase === "seleccion" && (
            <>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Buscar empleado…"
                  value={q}
                  onChange={(A) => setQ(A.target.value)}
                  className="!pl-9"
                />
              </div>
              {filtrados.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">
                  {q
                    ? "Sin coincidencias."
                    : "No hay empleados con pago pendiente."}
                </p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="grid grid-cols-[auto_1fr_auto] gap-2 p-2 eyebrow text-gray-500"
                    style={{
                      background: colors.navyDark,
                    }}
                  >
                    <span />
                    <span>Nombre</span>
                    <span className="text-right">A pagar</span>
                  </div>
                  {filtrados.map((filtrado, H) => (
                    <label
                      className="grid grid-cols-[auto_1fr_auto] gap-2 p-2 border-t border-gray-100 items-center text-xs"
                      style={{
                        background: seleccion.has(filtrado.id)
                          ? hexToRgba(colors.primary, 0.08)
                          : H % 2
                            ? "#F8F8F6"
                            : "#fff",
                      }}
                      key={filtrado.id}
                    >
                      <input
                        type="checkbox"
                        checked={seleccion.has(filtrado.id)}
                        onChange={() => toggleSeleccion(filtrado.id)}
                      />
                      <span
                        className="truncate flex items-center gap-1.5"
                        style={{
                          color: colors.navyDark,
                        }}
                      >
                        {esEmpleado
                          ? `${filtrado.nombre} ${filtrado.apellido}`
                          : filtrado.nombre}
                        {esEmpleado && (
                          <CodeBadge
                            code={ciclo === "mensual" ? "M" : "Q"}
                            size={14}
                          />
                        )}
                      </span>
                      <span
                        className="text-right font-semibold"
                        style={{
                          color: colors.navyDark,
                        }}
                      >
                        €{calculos[filtrado.id].totalPagar.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div
                className="mt-3 grid grid-cols-[1fr_auto] gap-2 p-2 rounded-xl text-xs font-semibold"
                style={{
                  background: hexToRgba(colors.primary, 0.1),
                  color: colors.primary,
                }}
              >
                <span>Seleccionados ({seleccionados.length})</span>
                <span className="text-right">
                  €{totalSeleccionado.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  variant="outline"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => setFase("idle")}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={<Check className="w-4 h-4" />}
                  disabled={seleccionados.length === 0}
                  onClick={() => setFase("encargado")}
                >
                  Continuar
                </Button>
              </div>
            </>
          )}
          {fase === "encargado" && (
            <>
              <div
                className="grid grid-cols-[1fr_auto] gap-2 p-2 mb-3 rounded-xl text-xs font-semibold"
                style={{
                  background: hexToRgba(colors.primary, 0.1),
                  color: colors.primary,
                }}
              >
                <span>A pagar ({seleccionados.length})</span>
                <span className="text-right">
                  €{totalSeleccionado.toFixed(2)}
                </span>
              </div>
              <Input
                label="Nombre del encargado (quien reparte el efectivo)"
                type="text"
                placeholder="Nombre y apellidos"
                value={encargado}
                onChange={(A) => setEncargado(A.target.value)}
              />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  variant="outline"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => setFase("seleccion")}
                >
                  Volver
                </Button>
                <Button
                  variant="primary"
                  icon={<Wallet className="w-4 h-4" />}
                  disabled={!encargado.trim()}
                  onClick={generarLista}
                >
                  Generar y pagar
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
      {esEmpleado && ciclo === "quincenal" && (
        <Card>
          <SectionTitle color="green">
            Listas generadas · Quincenal
          </SectionTitle>
          {listas.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">
              Sin listas generadas en este ciclo.
            </p>
          ) : (
            <div className="space-y-2">
              {listas.map((lista) => (
                <div
                  className="border border-gray-100 rounded-xl p-3 bg-gradient-to-r from-white to-gray-50"
                  key={lista.id}
                >
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() =>
                      setListaAbierta(
                        listaAbierta === lista.id ? null : lista.id,
                      )
                    }
                  >
                    <div className="text-left flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full eyebrow"
                        style={{
                          background: hexToRgba("#6E7370", 0.08),
                          color: "#6E7370",
                        }}
                      >
                        {lista.ciclo}
                      </span>
                      <div>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: colors.navyDark,
                          }}
                        >
                          {lista.periodo_inicio}
                          {" – "}
                          {lista.periodo_fin}
                        </p>
                        {lista.encargado && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {"Encargado: "}
                            {lista.encargado}
                          </p>
                        )}
                      </div>
                    </div>
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: colors.primary,
                      }}
                    >
                      €{Number(lista.total_monto).toFixed(2)}
                    </p>
                  </button>
                  {listaAbierta === lista.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {lista.items.map((item, v) => (
                        <div
                          className="flex justify-between text-[11px]"
                          style={{
                            color: colors.navyDark,
                          }}
                          key={v}
                        >
                          <span className="flex items-center gap-1">
                            {item.nombre}
                            {lista.ciclo && (
                              <CodeBadge
                                code={lista.ciclo === "mensual" ? "M" : "Q"}
                                size={13}
                              />
                            )}
                          </span>
                          <span className="font-semibold">
                            €{Number(item.total_pagado).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          icon={<Printer className="w-4 h-4" />}
                          onClick={() =>
                            abrirPlanilla({
                              titulo: `Lista de pago ${lista.ciclo}`,
                              subtitulo: `${lista.periodo_inicio} – ${lista.periodo_fin}${
                                lista.encargado
                                  ? ` · Reparte: ${lista.encargado}`
                                  : ""
                              }`,
                              columnas: ["Nombre", "Importe", "Firma"],
                              filas: lista.items.map((item) => [
                                item.nombre,
                                eur(item.total_pagado),
                                "",
                              ]),
                              total: lista.total_monto,
                            })
                          }
                        >
                          Imprimir
                        </Button>
                        <Button
                          variant="danger"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => {
                            esEmpleado
                              ? actions.cancelarListaEmpleados(lista.id)
                              : actions.cancelarListaFurgonetas(lista.id);
                            setListaAbierta(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}
