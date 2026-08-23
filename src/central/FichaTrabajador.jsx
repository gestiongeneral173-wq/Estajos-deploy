import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pen,
  Trash2,
  TrendingDown,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import { CodeBadge } from "../components/ui/Badges.jsx";
import {
  Accordion,
  Button,
  Card,
  Input,
  SectionTitle,
  Sheet,
} from "../components/ui/primitives.jsx";
import { calcEmpleado, saldoEmpleado } from "../lib/calculos.js";
import { eur, hoy } from "../lib/format.js";
import { colors, hexToRgba } from "../theme.js";

/**
 * Dar y quitar el rol de encargado. Sólo existe aquí, en Central.
 *
 * Encender no es sólo marcar una casilla: lo que convierte a alguien en
 * encargado es tener un PIN, porque es su única credencial de Campo (la
 * cuenta que le crea `generar_pin()` no tiene contraseña). Por eso el
 * interruptor genera el PIN y lo enseña una vez — luego ya no se puede ver.
 *
 * Apagar manda `es_encargado = false`, y el disparador `sincronizar_encargado`
 * de la base se encarga del resto: anula el PIN activo y desactiva su perfil.
 * Sin perfil activo, `verificar_pin()` ya no le devuelve sesión.
 */
function SwitchEncargado({
  trabajador,
  actions,
  pinNuevo,
  setPinNuevo,
  ocupado,
  setOcupado,
}) {
  const esEncargado = trabajador.es_encargado;

  const cambiar = async () => {
    if (ocupado) return;

    if (esEncargado) {
      const confirmado = window.confirm(
        `¿Quitar a ${trabajador.nombre} ${trabajador.apellido} el rol de encargado? ` +
          "Se anula su PIN y deja de poder entrar en Campo. Sus jornadas y su saldo no se tocan.",
      );
      if (!confirmado) return;
      setOcupado(true);
      try {
        await actions.actualizarTrabajador(trabajador.id, {
          es_encargado: false,
        });
        setPinNuevo(null);
      } catch {
        // El aviso lo pinta CentralApp a partir del error del store.
      } finally {
        setOcupado(false);
      }
      return;
    }

    setOcupado(true);
    try {
      const generados = await actions.generarPinesEncargado([trabajador.id]);
      setPinNuevo(generados?.[0]?.pin ?? null);
    } catch {
      /* idem */
    } finally {
      setOcupado(false);
    }
  };

  // Rotar sin tocar el rol: hasta ahora había que ir al modal de PINs de
  // Registros para dar uno nuevo a alguien que ya era encargado.
  const rotar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      const generados = await actions.generarPinesEncargado([trabajador.id]);
      setPinNuevo(generados?.[0]?.pin ?? null);
    } catch {
      /* el aviso lo pinta CentralApp */
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-gray-500">Rol</p>
          <p
            className="text-sm font-semibold"
            style={{ color: colors.navyDark }}
          >
            {esEncargado ? "Encargado de campo" : "Empleado"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {esEncargado
              ? "Puede entrar en Campo con su PIN y enviar partes."
              : "Al activarlo se le genera un PIN para entrar en Campo."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={esEncargado}
          aria-label={
            esEncargado ? "Quitar rol de encargado" : "Hacer encargado"
          }
          disabled={ocupado}
          onClick={cambiar}
          className="w-[52px] h-[30px] rounded-full flex-shrink-0 p-[3px] transition-colors disabled:opacity-40"
          style={{ background: esEncargado ? colors.primary : colors.line }}
        >
          <span
            className="block w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{
              transform: esEncargado ? "translateX(22px)" : "translateX(0)",
            }}
          />
        </button>
      </div>

      {esEncargado && !pinNuevo && (
        <Button
          variant="outline"
          className="mt-3"
          disabled={ocupado}
          onClick={rotar}
        >
          Generar un PIN nuevo
        </Button>
      )}

      {pinNuevo && (
        <div
          className="mt-3 rounded-xl p-3"
          style={{
            background: hexToRgba(colors.primary, 0.08),
            border: `1px solid ${hexToRgba(colors.primary, 0.25)}`,
          }}
        >
          <p className="eyebrow text-gray-600">PIN generado</p>
          <p className="text-[11px] text-gray-600 -mt-0.5 mb-1">
            Apúntalo ahora: no se puede volver a ver. Si se pierde, se genera
            otro.
          </p>
          <p
            className="text-2xl font-semibold tracking-widest cifra"
            style={{ color: colors.navyDark }}
          >
            {pinNuevo}
          </p>
          <button
            onClick={() => setPinNuevo(null)}
            className="text-gray-600 text-xs mt-1"
          >
            Ocultar
          </button>
        </div>
      )}
    </Card>
  );
}

export function FichaTrabajador({ id, state, actions, onBack }) {
  const { trabajadores, pagos } = state,
    trabajador = trabajadores.find((T) => T.id === id),
    [editando, setEditando] = useState(false),
    [form, setForm] = useState(
      trabajador
        ? {
            ...trabajador,
          }
        : {},
    ),
    [montoAdelanto, setMontoAdelanto] = useState(""),
    [fechaAdelanto, setFechaAdelanto] = useState(hoy),
    // Suelo de la fecha del adelanto: el inicio del ciclo vigente de esta
    // persona. Un ciclo ya cerrado no admite adelantos nuevos, y la base lo
    // rechaza igual (0015).
    inicioCiclo =
      state.periodos?.[trabajador?.payment_period ?? "quincenal"]?.inicio || "",
    tarifaValida = parseFloat(form.tarifa_hora) > 0,
    [adelantoEditando, setAdelantoEditando] = useState(null),
    [valorAdelanto, setValorAdelanto] = useState(""),
    [confirmAdelanto, setConfirmAdelanto] = useState(null),
    [jornadaEditando, setJornadaEditando] = useState(null),
    [borradorJornada, setBorradorJornada] = useState({
      horas: "",
      destajo: "",
    }),
    [confirmBaja, setConfirmBaja] = useState(false),
    [tarifaOculta, setTarifaOculta] = useState(false),
    [pagoAbierto, setPagoAbierto] = useState(null),
    [pinNuevo, setPinNuevo] = useState(null),
    [cambiandoRol, setCambiandoRol] = useState(false);
  if (!trabajador) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <Card>
          <p
            className="text-xs text-center py-4"
            style={{
              color: colors.danger,
            }}
          >
            Trabajador no encontrado.
          </p>
          <Button
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Volver a registros
          </Button>
        </Card>
      </div>
    );
  }
  const pend = calcEmpleado(state, id),
    saldo = saldoEmpleado(state, id),
    pagosDelTrabajador = pagos.filter((pago) => pago.empleado_id === id),
    resumenBaja = {
      total_devengado: pend.totalDevengado,
      total_adelantos: pend.totalAdelantos,
      monto_neto: saldo,
    };
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        {" Volver a Registros"}
      </button>
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="font-semibold text-base"
                style={{
                  color: colors.navyDark,
                }}
              >
                {trabajador.nombre} {trabajador.apellido}
              </h2>
              <CodeBadge
                code={trabajador.payment_period === "mensual" ? "M" : "Q"}
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">{trabajador.telefono}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">
              {"Cuenta: "}
              {trabajador.cuenta || "sin registrar"}
            </p>
            {/* Cambiar de ciclo a mitad de período cambiaría a qué bloque
                pertenece el trabajo ya registrado, así que el cambio espera al
                próximo pago (lo aplica `liquidar_trabajador`). */}
            {trabajador.payment_period_pendiente && (
              <p
                className="text-[11px] mt-0.5"
                style={{ color: colors.primary }}
              >
                {"Pasará a "}
                {trabajador.payment_period_pendiente === "mensual"
                  ? "mensual"
                  : "quincenal"}
                {" en el próximo pago"}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setForm({
                ...trabajador,
              });
              setEditando((T) => !T);
            }}
            className="ml-3 p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
          >
            {editando ? <X className="w-4 h-4" /> : <Pen className="w-4 h-4" />}
          </button>
        </div>
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background:
              saldo >= 0
                ? "linear-gradient(90deg,#F0F4F1,#F0F4F1)"
                : "linear-gradient(90deg,#FAF2F0,#FAF2F0)",
            border: `1px solid ${saldo >= 0 ? "#DFE8E2" : "#F2E1DD"}`,
          }}
        >
          <p className="eyebrow text-gray-500 mb-1">Saldo neto</p>
          <p
            className="font-semibold text-2xl"
            style={{
              color: saldo >= 0 ? colors.primary : colors.danger,
            }}
          >
            {eur(saldo)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center relative">
          <p className="eyebrow text-gray-500 mb-1">Tarifa/hora</p>
          <p
            className="font-semibold text-sm"
            style={{
              color: colors.navyDark,
            }}
          >
            {tarifaOculta ? "••••" : eur(trabajador.tarifa_hora)}
          </p>
          <button
            type="button"
            aria-label={tarifaOculta ? "Mostrar tarifa" : "Ocultar tarifa"}
            onClick={() => setTarifaOculta((Yz) => !Yz)}
            className="absolute top-0 right-3 p-1.5 text-gray-400 hover:text-gray-600 active:scale-90"
          >
            {tarifaOculta ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </Card>
      <SwitchEncargado
        trabajador={trabajador}
        actions={actions}
        pinNuevo={pinNuevo}
        setPinNuevo={setPinNuevo}
        ocupado={cambiandoRol}
        setOcupado={setCambiandoRol}
      />
      {editando && (
        <Card>
          <SectionTitle color="gold">Editar datos</SectionTitle>
          <div className="space-y-3">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(T) =>
                setForm({
                  ...form,
                  nombre: T.target.value,
                })
              }
            />
            <Input
              label="Apellido"
              value={form.apellido}
              onChange={(T) =>
                setForm({
                  ...form,
                  apellido: T.target.value,
                })
              }
            />
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(T) =>
                setForm({
                  ...form,
                  telefono: T.target.value,
                })
              }
            />
            <Input
              label="Cuenta bancaria"
              value={form.cuenta}
              onChange={(T) =>
                setForm({
                  ...form,
                  cuenta: T.target.value,
                })
              }
            />
            <div>
              <label className="eyebrow text-gray-600">Tipo de ciclo</label>
              <select
                value={form.payment_period}
                onChange={(T) =>
                  setForm({
                    ...form,
                    payment_period: T.target.value,
                  })
                }
                className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-colors"
                style={{
                  color: colors.navyDark,
                }}
              >
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
              </select>
              <p className="mt-1.5 text-[11px] text-gray-500">
                El cambio no se aplica ahora: entra en vigor con el próximo
                pago.
              </p>
            </div>
            <Input
              label="Tarifa/hora (€)"
              type="number"
              min="0.01"
              step="0.01"
              value={form.tarifa_hora}
              onChange={(T) =>
                setForm({
                  ...form,
                  tarifa_hora: T.target.value,
                })
              }
            />
            {!tarifaValida && (
              <p className="text-[11px]" style={{ color: colors.danger }}>
                La tarifa por hora debe ser mayor a 0.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={!tarifaValida}
                onClick={() => {
                  actions.actualizarTrabajador(id, form);
                  setEditando(false);
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <SectionTitle color="green">{`Nómina Actual (${pend.jornadas.length})`}</SectionTitle>
        {pend.jornadas.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            Sin jornadas.
          </p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-6 gap-1 pb-2 border-b border-gray-100">
              {["Fecha", "Horas", "Destajo", "Tarifa", "Subtotal", ""].map(
                (T, XVar) => (
                  <p
                    className="eyebrow text-gray-500 text-center first:text-left"
                    key={XVar}
                  >
                    {T}
                  </p>
                ),
              )}
            </div>
            {pend.jornadas.map((jornada) => {
              const XVar = jornadaEditando === jornada.id,
                we = jornada.horas * jornada.tarifa + Number(jornada.destajo);
              return (
                <div
                  className="grid grid-cols-6 gap-1 py-1.5 border-b border-gray-50 last:border-0 items-center"
                  key={jornada.id}
                >
                  <p
                    className="text-[11px]"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {jornada.fecha}
                  </p>
                  {XVar ? (
                    <input
                      type="number"
                      autoFocus={true}
                      value={borradorJornada.horas}
                      onChange={(A) =>
                        setBorradorJornada({
                          ...borradorJornada,
                          horas: A.target.value,
                        })
                      }
                      className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-center"
                    />
                  ) : (
                    <p
                      className="text-[11px] text-center"
                      style={{
                        color: colors.navyDark,
                      }}
                    >
                      {jornada.horas}
                    </p>
                  )}
                  {XVar ? (
                    <input
                      type="number"
                      value={borradorJornada.destajo}
                      onChange={(A) =>
                        setBorradorJornada({
                          ...borradorJornada,
                          destajo: A.target.value,
                        })
                      }
                      className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-center"
                    />
                  ) : (
                    <p
                      className="text-[11px] text-center"
                      style={{
                        color: colors.navyDark,
                      }}
                    >
                      {eur(jornada.destajo)}
                    </p>
                  )}
                  <p className="text-[11px] text-center text-gray-500">
                    {eur(jornada.tarifa)}/h
                  </p>
                  <p
                    className="text-[11px] text-right font-semibold"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {eur(we)}
                  </p>
                  {XVar ? (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          actions.editarJornada(jornada.id, {
                            horas: parseFloat(borradorJornada.horas) || 0,
                            destajo: parseFloat(borradorJornada.destajo) || 0,
                          });
                          setJornadaEditando(null);
                        }}
                        style={{
                          color: colors.primary,
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setJornadaEditando(null)}
                        className="text-gray-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setJornadaEditando(jornada.id);
                        setBorradorJornada({
                          horas: String(jornada.horas),
                          destajo: String(jornada.destajo),
                        });
                      }}
                      className="flex justify-end text-gray-500 hover:text-gray-700"
                    >
                      <Pen className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card>
        <SectionTitle color="green">Dar adelanto</SectionTitle>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Monto (€)"
            value={montoAdelanto}
            onChange={(T) => setMontoAdelanto(T.target.value)}
            className="flex-1"
          />
          {/* La fecha decide en qué ciclo se descuenta: un adelanto entregado
              el día 28 y anotado el 2 caería en el ciclo equivocado. */}
          <Input
            type="date"
            min={inicioCiclo || undefined}
            max={hoy()}
            value={fechaAdelanto}
            onChange={(T) => setFechaAdelanto(T.target.value)}
            className="flex-1"
          />
          <Button
            variant="primary"
            className="w-auto px-4"
            disabled={!montoAdelanto}
            onClick={() => {
              actions.registrarAdelanto(
                id,
                parseFloat(montoAdelanto) || 0,
                fechaAdelanto,
              );
              setMontoAdelanto("");
              setFechaAdelanto(hoy());
            }}
          >
            DAR
          </Button>
        </div>
      </Card>
      <Accordion
        title={`Adelantos (${pend.adelantos.length})`}
        color="gold"
        defaultOpen={pend.adelantos.length > 0}
      >
        {pend.adelantos.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            Sin adelantos.
          </p>
        ) : (
          <div className="space-y-2">
            {pend.adelantos.map((adelanto) => (
              <div
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                key={adelanto.id}
              >
                <div className="flex items-center gap-2">
                  <TrendingDown
                    className="w-3 h-3"
                    style={{
                      color: colors.danger,
                    }}
                  />
                  <p className="text-xs text-gray-600">{adelanto.fecha}</p>
                </div>
                {adelantoEditando === adelanto.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      autoFocus={true}
                      value={valorAdelanto}
                      onChange={(XVar) => setValorAdelanto(XVar.target.value)}
                      className="w-16 px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-right"
                    />
                    <button
                      onClick={() =>
                        setConfirmAdelanto({
                          tipo: "editar",
                          id: adelanto.id,
                          monto: parseFloat(valorAdelanto) || 0,
                        })
                      }
                      style={{
                        color: colors.primary,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAdelantoEditando(null)}
                      className="text-gray-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: colors.danger,
                      }}
                    >
                      {eur(adelanto.monto)}
                    </p>
                    <button
                      onClick={() => {
                        setAdelantoEditando(adelanto.id);
                        setValorAdelanto(String(adelanto.monto));
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Pen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmAdelanto({
                          tipo: "eliminar",
                          id: adelanto.id,
                        })
                      }
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Accordion>
      <Accordion
        title={`Nóminas Anteriores (${pagosDelTrabajador.length})`}
        color="green"
      >
        {pagosDelTrabajador.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            Sin pagos registrados.
          </p>
        ) : (
          <div className="space-y-2">
            {pagosDelTrabajador.map((T) => (
              <div className="border-b border-gray-50 last:border-0" key={T.id}>
                <button
                  type="button"
                  onClick={() =>
                    setPagoAbierto((Ys) => (Ys === T.id ? null : T.id))
                  }
                  className="w-full flex items-center justify-between py-2 text-left"
                >
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: colors.navyDark,
                      }}
                    >
                      {T.created_at}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {T.periodo_inicio}
                      {" – "}
                      {T.periodo_fin}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet
                      className="w-3 h-3"
                      style={{
                        color: colors.primary,
                      }}
                    />
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: colors.primary,
                      }}
                    >
                      {eur(T.total_pagado)}
                    </p>
                    {pagoAbierto === T.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </button>
                {pagoAbierto === T.id && (
                  <div className="pb-3">
                    {!T.dias || T.dias.length === 0 ? (
                      <p className="text-gray-500 text-[11px] text-center py-3">
                        Sin detalle disponible para este pago.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-6 gap-1 bg-gray-50 p-2 eyebrow text-gray-600">
                          {[
                            "Fecha",
                            "Horas",
                            "Destajo",
                            "Tarifa",
                            "Subtotal",
                            "",
                          ].map((XVar, H) => (
                            <p
                              className="eyebrow text-gray-500 text-center first:text-left"
                              key={H}
                            >
                              {XVar}
                            </p>
                          ))}
                        </div>
                        {T.dias.map((XVar) => (
                          <div
                            className="grid grid-cols-6 gap-1 p-2 border-t border-gray-100 text-[11px] items-center"
                            style={{
                              color: colors.navyDark,
                            }}
                            key={XVar.id}
                          >
                            <span>{XVar.fecha}</span>
                            <span className="text-center">{XVar.horas}</span>
                            <span className="text-center">€{XVar.destajo}</span>
                            <span className="text-center text-gray-500">
                              €{XVar.tarifa}/h
                            </span>
                            <span className="text-right font-semibold">
                              €
                              {(
                                XVar.horas * XVar.tarifa +
                                Number(XVar.destajo)
                              ).toFixed(2)}
                            </span>
                            <span />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Accordion>
      <Card>
        <SectionTitle color="gold">Dar de baja</SectionTitle>
        <p className="text-gray-500 text-[11px] mb-3">
          Calcula lo que se le debe, liquida ese monto y retira al trabajador de
          forma permanente.
        </p>
        <Button
          variant="danger"
          icon={<UserX className="w-4 h-4" />}
          onClick={() => setConfirmBaja(true)}
        >
          Dar de baja
        </Button>
      </Card>
      <Sheet
        open={!!confirmAdelanto}
        title={
          (confirmAdelanto == null ? undefined : confirmAdelanto.tipo) ===
          "editar"
            ? "Confirmar edición"
            : "Confirmar eliminación"
        }
        onClose={() => setConfirmAdelanto(null)}
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {(confirmAdelanto == null ? undefined : confirmAdelanto.tipo) ===
            "editar"
              ? `¿Actualizar el monto de este adelanto a ${eur((confirmAdelanto == null ? undefined : confirmAdelanto.monto) ?? 0)}?`
              : "¿Eliminar este adelanto? Esta acción no se puede deshacer."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmAdelanto(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                confirmAdelanto.tipo === "editar"
                  ? (actions.editarAdelanto(
                      confirmAdelanto.id,
                      confirmAdelanto.monto,
                    ),
                    setAdelantoEditando(null))
                  : actions.eliminarAdelanto(confirmAdelanto.id);
                setConfirmAdelanto(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Sheet>
      <Sheet
        open={confirmBaja}
        title="Confirmar baja"
        onClose={() => setConfirmBaja(false)}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Devengado</span>
              <span
                className="font-semibold"
                style={{
                  color: colors.navyDark,
                }}
              >
                {eur(resumenBaja.total_devengado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adelantos</span>
              <span
                className="font-semibold"
                style={{
                  color: colors.danger,
                }}
              >
                −{eur(resumenBaja.total_adelantos)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">
                Neto a liquidar
              </span>
              <span
                className="font-semibold"
                style={{
                  color:
                    resumenBaja.monto_neto < 0 ? colors.danger : colors.primary,
                }}
              >
                {eur(resumenBaja.monto_neto)}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            {"¿Seguro que deseas dar de baja a "}
            <strong>
              {trabajador.nombre} {trabajador.apellido}
            </strong>
            ?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmBaja(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                actions.darDeBajaTrabajador(id);
                onBack();
              }}
            >
              SÍ, DAR DE BAJA
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
