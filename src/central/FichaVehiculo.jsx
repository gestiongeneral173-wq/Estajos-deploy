import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pen,
  Plus,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import {
  Accordion,
  Button,
  Card,
  Input,
  SectionTitle,
  Sheet,
} from "../components/ui/primitives.jsx";
import { calcVehiculo } from "../lib/calculos.js";
import { hoy } from "../lib/format.js";
import { colors, hexToRgba } from "../theme.js";

export function FichaVehiculo({ id, state, actions, onBack }) {
  const vehiculo = state.vehiculos.find((j) => j.id === id),
    [editando, setEditando] = useState(false),
    [form, setForm] = useState(
      vehiculo
        ? {
            ...vehiculo,
          }
        : {},
    ),
    [nuevoAdelanto, setNuevoAdelanto] = useState({
      concepto: "",
      monto: "",
    }),
    // La furgoneta cobra siempre por ciclo quincenal.
    inicioCiclo = state.periodos?.quincenal?.inicio || "",
    tarifaValida = parseFloat(form.tarifa_plaza) > 0,
    [accionAdelanto, setAccionAdelanto] = useState(null),
    [plazasEditando, setPlazasEditando] = useState(null),
    [valorPlazas, setValorPlazas] = useState(""),
    [confirmBaja, setConfirmBaja] = useState(false),
    [avisoBaja, setAvisoBaja] = useState(null),
    [confirmPago, setConfirmPago] = useState(false),
    [tarifaOculta, setTarifaOculta] = useState(false),
    [pagoAbierto, setPagoAbierto] = useState(null);
  if (!vehiculo) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <Card>
          <p
            className="text-xs text-center mb-4"
            style={{
              color: colors.danger,
            }}
          >
            Vehículo no encontrado.
          </p>
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
            Volver a vehículos
          </Button>
        </Card>
      </div>
    );
  }
  const calc = calcVehiculo(state, id),
    pagosDelVehiculo = state.pagosVehiculo.filter((j) => j.vehiculo_id === id);
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1
              className="font-semibold text-sm"
              style={{
                color: colors.navyDark,
              }}
            >
              {vehiculo.nombre}
            </h1>
            <p className="text-gray-600 text-[11px]">{vehiculo.matricula ?? "—"}</p>
          </div>
          <button
            onClick={() => {
              setForm({
                ...vehiculo,
              });
              setEditando((j) => !j);
            }}
            className="ml-3 p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
          >
            {editando ? <X className="w-4 h-4" /> : <Pen className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center relative">
            <p className="text-gray-600 text-[11px] uppercase">Tarifa/Plaza</p>
            <p
              className="font-semibold"
              style={{
                color: colors.navyDark,
              }}
            >
              {tarifaOculta ? "••••" : `€${vehiculo.tarifa_plaza}`}
            </p>
            <button
              type="button"
              aria-label={tarifaOculta ? "Mostrar tarifa" : "Ocultar tarifa"}
              onClick={() => setTarifaOculta((Yz) => !Yz)}
              className="absolute top-0 right-3 p-1.5 text-gray-400 hover:text-gray-600 active:scale-90"
            >
              {tarifaOculta ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-gray-600 text-[11px] uppercase">Tipo de Ciclo</p>
            <p
              className="font-semibold text-xs"
              style={{
                color: colors.navyDark,
              }}
            >
              Quincenal
            </p>
          </div>
        </div>
      </Card>
      {editando && (
        <Card>
          <SectionTitle color="gold">Editar datos</SectionTitle>
          <p className="text-[11px] text-gray-500 mb-3 -mt-2">
            Los cambios aplican a futuras jornadas; el histórico ya registrado no se altera.
          </p>
          <div className="space-y-3">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(j) =>
                setForm({
                  ...form,
                  nombre: j.target.value,
                })
              }
            />
            <Input
              label="Matrícula"
              value={form.matricula ?? ""}
              onChange={(j) =>
                setForm({
                  ...form,
                  matricula: j.target.value,
                })
              }
            />
            <Input
              label="Plazas totales"
              type="number"
              value={form.plazas_totales}
              onChange={(j) =>
                setForm({
                  ...form,
                  plazas_totales: j.target.value,
                })
              }
            />
            <Input
              label="Tarifa por plaza (€)"
              type="number"
              min="0.01"
              step="0.01"
              value={form.tarifa_plaza}
              onChange={(j) =>
                setForm({
                  ...form,
                  tarifa_plaza: j.target.value,
                })
              }
            />
            {!tarifaValida && (
              <p className="text-[11px]" style={{ color: colors.danger }}>
                La tarifa por plaza debe ser mayor a 0.
              </p>
            )}
            <Input
              label="Propietario"
              value={form.propietario ?? ""}
              onChange={(j) =>
                setForm({
                  ...form,
                  propietario: j.target.value,
                })
              }
            />
            <p className="text-[11px] text-gray-500">
              Tipo de ciclo: Quincenal (fijo, no editable).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={!tarifaValida}
                onClick={() => {
                  actions.actualizarVehiculo(id, form);
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
        <SectionTitle color="green">{`Nómina Actual (${calc.dias.length})`}</SectionTitle>
        {calc.dias.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-8">
            Sin registros para el período actual
          </p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 eyebrow text-gray-600">
              <span>Fecha</span>
              <span>Plazas</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {calc.dias.map((dia) => (
              <div
                className="grid grid-cols-4 gap-2 p-2 border-t border-gray-100 text-xs items-center"
                style={{
                  color: colors.navyDark,
                }}
                key={dia.id}
              >
                <span>{dia.fecha}</span>
                {plazasEditando === dia.id ? (
                  <input
                    type="number"
                    autoFocus={true}
                    value={valorPlazas}
                    onChange={(F) => setValorPlazas(F.target.value)}
                    className="w-14 px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs"
                  />
                ) : (
                  <span>{dia.plazas}</span>
                )}
                <span className="text-right font-semibold">
                  €{(dia.plazas * dia.tarifa_aplicada).toFixed(2)}
                </span>
                {plazasEditando === dia.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        actions.editarPlazasDia(dia.id, parseInt(valorPlazas, 10) || 0);
                        setPlazasEditando(null);
                      }}
                      style={{
                        color: colors.primary,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPlazasEditando(null)} className="text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPlazasEditando(dia.id);
                      setValorPlazas(String(dia.plazas));
                    }}
                    className="flex justify-end text-gray-500 hover:text-gray-700"
                  >
                    <Pen className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div
              className="grid grid-cols-4 gap-2 p-2 border-t border-gray-200 text-xs font-semibold"
              style={{
                background: hexToRgba(colors.primary, 0.08),
                color: colors.primary,
              }}
            >
              <span className="col-span-2 text-right">SUBTOTAL:</span>
              <span className="text-right">€{calc.totalDevengado.toFixed(2)}</span>
              <span />
            </div>
          </div>
        )}
      </Card>
      <Accordion
        title={`Adelantos (${calc.adelantos.length})`}
        color="gold"
        defaultOpen={calc.adelantos.length > 0}
      >
        <div className="bg-gray-50 rounded-xl p-3 space-y-3 mb-4">
          <Input
            label="Concepto (opcional)"
            placeholder="Ej: reparación"
            value={nuevoAdelanto.concepto}
            onChange={(j) =>
              setNuevoAdelanto({
                ...nuevoAdelanto,
                concepto: j.target.value,
              })
            }
          />
          <Input
            label="Monto (€)"
            type="number"
            value={nuevoAdelanto.monto}
            onChange={(j) =>
              setNuevoAdelanto({
                ...nuevoAdelanto,
                monto: j.target.value,
              })
            }
          />
          {/* La fecha decide en qué ciclo cae el descuento: un gasto de fin de
              mes anotado en el siguiente iría al ciclo equivocado. El suelo es
              el inicio del ciclo vigente — un ciclo ya cerrado no admite
              adelantos nuevos, y la base lo rechaza igual (0015). */}
          <Input
            label="Fecha"
            type="date"
            min={inicioCiclo || undefined}
            max={hoy()}
            value={nuevoAdelanto.fecha || hoy()}
            onChange={(j) =>
              setNuevoAdelanto({
                ...nuevoAdelanto,
                fecha: j.target.value,
              })
            }
          />
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            disabled={!nuevoAdelanto.monto}
            onClick={() => {
              actions.registrarAdelantoVehiculo(
                id,
                nuevoAdelanto.concepto,
                parseFloat(nuevoAdelanto.monto) || 0,
                nuevoAdelanto.fecha || hoy(),
              );
              setNuevoAdelanto({
                concepto: "",
                monto: "",
                fecha: "",
              });
            }}
          >
            Añadir adelanto
          </Button>
        </div>
        {calc.adelantos.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">Sin adelantos.</p>
        ) : (
          <div className="space-y-2">
            {calc.adelantos.map((adelanto) => (
              <div
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                key={adelanto.id}
              >
                <p className="text-xs text-gray-600 truncate flex-1 pr-2">
                  {adelanto.concepto || "Adelanto"}
                </p>
                {(accionAdelanto == null ? undefined : accionAdelanto.id) === adelanto.id &&
                (accionAdelanto == null ? undefined : accionAdelanto.tipo) === "editando" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      autoFocus={true}
                      defaultValue={adelanto.monto}
                      onChange={(F) => (accionAdelanto.monto = parseFloat(F.target.value) || 0)}
                      className="w-16 px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-right"
                    />
                    <button
                      onClick={() =>
                        setAccionAdelanto({
                          tipo: "editar",
                          id: adelanto.id,
                          monto: accionAdelanto.monto ?? adelanto.monto,
                        })
                      }
                      style={{
                        color: colors.primary,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setAccionAdelanto(null)} className="text-gray-500">
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
                      €{Number(adelanto.monto).toFixed(2)}
                    </p>
                    <button
                      onClick={() =>
                        setAccionAdelanto({
                          tipo: "editando",
                          id: adelanto.id,
                        })
                      }
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Pen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setAccionAdelanto({
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
        title={`Nóminas Anteriores (${pagosDelVehiculo.length})`}
        color="gold"
        defaultOpen={pagosDelVehiculo.length > 0}
      >
        {pagosDelVehiculo.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">Sin pagos liquidados todavía.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 gap-1 bg-gray-50 p-2 eyebrow text-gray-600">
              <span>Período</span>
              <span className="text-right">Ganado</span>
              <span className="text-right">Adelantos</span>
              <span className="text-right">Pagado</span>
            </div>
            {pagosDelVehiculo.map((j) => (
              <div className="border-t border-gray-100" key={j.id}>
                <button
                  type="button"
                  onClick={() => setPagoAbierto((Ys) => (Ys === j.id ? null : j.id))}
                  className="w-full grid grid-cols-4 gap-1 p-2 text-[11px] items-center text-left"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  <span className="flex items-center gap-1">
                    {pagoAbierto === j.id ? (
                      <ChevronUp className="w-3 h-3 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                    )}
                    {j.periodo_inicio}
                    {" – "}
                    {j.periodo_fin}
                  </span>
                  <span className="text-right">€{Number(j.total_devengado).toFixed(2)}</span>
                  <span
                    className="text-right"
                    style={{
                      color: colors.danger,
                    }}
                  >
                    −€{Number(j.total_adelantos).toFixed(2)}
                  </span>
                  <span
                    className="text-right font-semibold"
                    style={{
                      color: colors.primary,
                    }}
                  >
                    €{Number(j.total_pagado).toFixed(2)}
                  </span>
                </button>
                {pagoAbierto === j.id && (
                  <div className="px-2 pb-2">
                    {!j.dias || j.dias.length === 0 ? (
                      <p className="text-gray-500 text-[11px] text-center py-3">
                        Sin detalle disponible para este pago.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 eyebrow text-gray-600">
                          <span>Fecha</span>
                          <span>Plazas</span>
                          <span className="text-right">Total</span>
                          <span />
                        </div>
                        {j.dias.map((XVar) => (
                          <div
                            className="grid grid-cols-4 gap-2 p-2 border-t border-gray-100 text-xs items-center"
                            style={{
                              color: colors.navyDark,
                            }}
                            key={XVar.id}
                          >
                            <span>{XVar.fecha}</span>
                            <span>{XVar.plazas}</span>
                            <span className="text-right font-semibold">
                              €{(XVar.plazas * XVar.tarifa_aplicada).toFixed(2)}
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
          Calcula lo que se le debe, liquida ese monto y retira la furgoneta de forma permanente.
        </p>
        <Button
          variant="danger"
          icon={<UserX className="w-4 h-4" />}
          onClick={() => setConfirmBaja(true)}
        >
          Dar de baja
        </Button>
      </Card>
      {calc.totalPagar !== 0 && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Devengado</span>
            <span
              className="font-semibold"
              style={{
                color: colors.navyDark,
              }}
            >
              €{calc.totalDevengado.toFixed(2)}
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
              −€{calc.totalAdelantos.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-200">
            <span className="text-gray-700 font-semibold">Neto a pagar</span>
            <span
              className="font-semibold"
              style={{
                color: calc.totalPagar < 0 ? colors.danger : colors.primary,
              }}
            >
              €{calc.totalPagar.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          variant="primary"
          disabled={calc.dias.length === 0 && calc.adelantos.length === 0}
          onClick={() => setConfirmPago(true)}
        >
          Pagar
        </Button>
      </div>
      <Sheet
        open={
          !!accionAdelanto &&
          (accionAdelanto.tipo === "editar" || accionAdelanto.tipo === "eliminar")
        }
        title={
          (accionAdelanto == null ? undefined : accionAdelanto.tipo) === "editar"
            ? "Confirmar edición"
            : "Confirmar eliminación"
        }
        onClose={() => setAccionAdelanto(null)}
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {(accionAdelanto == null ? undefined : accionAdelanto.tipo) === "editar"
              ? `¿Actualizar el monto a €${Number((accionAdelanto == null ? undefined : accionAdelanto.monto) ?? 0).toFixed(2)}?`
              : "¿Eliminar este adelanto? Esta acción no se puede deshacer."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setAccionAdelanto(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                accionAdelanto.tipo === "editar"
                  ? actions.editarAdelantoVehiculo(accionAdelanto.id, accionAdelanto.monto)
                  : actions.eliminarAdelantoVehiculo(accionAdelanto.id);
                setAccionAdelanto(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={confirmBaja} title="Confirmar baja" onClose={() => setConfirmBaja(false)}>
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {"¿Seguro que deseas dar de baja a "}
            <strong>{vehiculo.nombre}</strong>? Se liquidará lo que tenga pendiente y dejará de
            aparecer en las pantallas. Su histórico de pagos se conserva.
          </p>
          {/* La base se niega si quedan jornadas de empleados sin liquidar en
              los partes de esa furgoneta. Se vuelve a preguntar en vez de
              tragarse el error. */}
          {avisoBaja && (
            <p className="text-sm" style={{ color: colors.danger }}>
              {avisoBaja}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmBaja(false);
                setAvisoBaja(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await actions.darDeBajaVehiculo(id, Boolean(avisoBaja));
                  onBack();
                } catch (e) {
                  if (avisoBaja) throw e;
                  setAvisoBaja(`${e.message}. Pulsa otra vez para darla de baja igualmente.`);
                }
              }}
            >
              {avisoBaja ? "DAR DE BAJA IGUALMENTE" : "SÍ, DAR DE BAJA"}
            </Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={confirmPago} title="Confirmar pago" onClose={() => setConfirmPago(false)}>
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {"¿Liquidar el ciclo quincenal de "}
            <strong>{vehiculo.nombre}</strong>?
          </p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Devengado</span>
              <span
                className="font-semibold"
                style={{
                  color: colors.navyDark,
                }}
              >
                €{calc.totalDevengado.toFixed(2)}
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
                −€{calc.totalAdelantos.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">Neto a pagar</span>
              <span
                className="font-semibold"
                style={{
                  color: colors.primary,
                }}
              >
                €{calc.totalPagar.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmPago(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                actions.pagarVehiculo(id);
                setConfirmPago(false);
              }}
            >
              Confirmar pago
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
