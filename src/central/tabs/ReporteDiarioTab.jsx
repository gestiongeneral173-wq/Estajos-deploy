import { useEffect, useMemo, useState } from "react";
import { Check, Pen, Trash2, X } from "lucide-react";
import { CodeBadge } from "../../components/ui/Badges.jsx";
import { Button, Card, Input, SectionTitle, Sheet } from "../../components/ui/primitives.jsx";
import { hoy } from "../../lib/format.js";
import { colors } from "../../theme.js";

export function ReporteDiarioTab({ state, actions }) {
  const { jornadas, trabajadores, vehiculos, temporales, trabajadoresBaja = [] } = state,
    [fecha, setFecha] = useState(hoy()),
    [editando, setEditando] = useState(null),
    [borrador, setBorrador] = useState({
      horas: "",
      destajo: "",
    }),
    [grupoAbierto, setGrupoAbierto] = useState(null),
    [seleccion, setSeleccion] = useState(new Set()),
    [confirmarBorrado, setConfirmarBorrado] = useState(false);
  useEffect(() => {
    setGrupoAbierto(null);
    setSeleccion(new Set());
  }, [fecha]);
  const toggleGrupo = (D) => {
      setGrupoAbierto((U) => (U === D ? null : D));
      setSeleccion(new Set());
    },
    toggleSeleccion = (D) =>
      setSeleccion((U) => {
        const $ = new Set(U);
        $.has(D) ? $.delete(D) : $.add(D);
        return $;
      }),
    infoEncargado = (D) => {
      if (!D) {
        return {
          nombre: "Sin encargado asignado",
        };
      }
      const U = trabajadores.find((trabajador) => trabajador.id === D);
      if (U) {
        return {
          nombre: `${U.nombre} ${U.apellido}`,
          payment_period: U.payment_period,
        };
      }
      // Con baja lógica el nombre nunca se pierde: se dice quién era y que ya
      // no está, en vez de dejar un "—" que no explica nada.
      const B = trabajadoresBaja.find((trabajador) => trabajador.id === D);
      return {
        nombre: B ? `${B.nombre} ${B.apellido}` : "Encargado despedido",
        de_baja: true,
      };
    },
    infoVehiculo = (D) =>
      vehiculos.find((vehiculo) => vehiculo.id === D) || {
        nombre: "Vehículo dado de baja",
      },
    grupos = useMemo(() => {
      const D = jornadas.filter((jornada) => jornada.fecha === fecha),
        U = {};
      D.forEach(($) => {
        const T =
          $.origen === "central"
            ? "central"
            : `${$.registrado_por ?? "s/e"}-${$.vehiculo_id ?? "s/v"}`;
        U[T] ||
          (U[T] =
            $.origen === "central"
              ? {
                  key: T,
                  esCentral: true,
                  // Las horas que apunta la oficina no salen de ninguna
                  // furgoneta, así que ocupan su sitio con nombre propio.
                  encargado: { nombre: "Apuntado desde la oficina" },
                  vehiculo: { nombre: "Registro Central" },
                  empleados: [],
                }
              : {
                  key: T,
                  esCentral: false,
                  // Por QUIEN REGISTRÓ el parte, no por quien lleva la
                  // insignia a bordo: ese rol ahora es opcional, y agrupar por
                  // él metería en el mismo montón toda furgoneta sin encargado.
                  encargado: infoEncargado($.registrado_por),
                  vehiculo: infoVehiculo($.vehiculo_id),
                  empleados: [],
                });
        U[T].empleados.push($);
      });
      // Registro Central siempre el primero.
      return Object.values(U).sort((a, b) => Number(b.esCentral) - Number(a.esCentral));
    }, [jornadas, fecha, trabajadores, vehiculos, trabajadoresBaja]),
    guardarEdicion = (D) => {
      actions.editarJornada(D, {
        horas: parseFloat(borrador.horas) || 0,
        destajo: parseFloat(borrador.destajo) || 0,
      });
      setEditando(null);
    },
    grupoActivo = grupos.find((grupo) => grupo.key === grupoAbierto),
    nombresSeleccionados = useMemo(
      () =>
        grupoActivo
          ? grupoActivo.empleados
              .filter((empleado) => seleccion.has(empleado.id))
              .map((D) => trabajadores.find((trabajador) => trabajador.id === D.empleado_id))
              .map((D) => (D ? `${D.nombre} ${D.apellido}` : "—"))
          : [],
      [grupoActivo, seleccion, trabajadores],
    ),
    eliminarSeleccionados = () => {
      actions.eliminarJornadas([...seleccion]);
      setSeleccion(new Set());
      setGrupoAbierto(null);
      setConfirmarBorrado(false);
    };
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <SectionTitle color="gold">Reporte Diario</SectionTitle>
        <Input label="Fecha" type="date" value={fecha} onChange={(D) => setFecha(D.target.value)} />
      </Card>
      <div className="space-y-3">
        {grupos.length === 0 ? (
          <Card>
            <SectionTitle color="green">Jornadas registradas</SectionTitle>
            <p className="text-gray-500 text-xs text-center py-8">Sin datos para esta fecha.</p>
          </Card>
        ) : (
          grupos.map((grupo) => {
            var $, T;
            const U = grupoAbierto === grupo.key;
            return (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden" key={grupo.key}>
                <div
                  className="px-5 pt-4 pb-3 flex items-start justify-between gap-2 border-b"
                  style={{
                    borderColor: colors.line,
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="font-semibold text-[17px] tracking-tight truncate"
                      style={{
                        color: colors.navyDark,
                      }}
                    >
                      {((T = grupo.vehiculo) == null ? undefined : T.nombre) ?? "—"}
                    </p>
                    <p
                      className="text-[11px] mt-1 flex items-center gap-1.5"
                      style={{
                        color: colors.muted,
                      }}
                    >
                      {"Encargado: "}
                      {(($ = grupo.encargado) == null ? undefined : $.nombre) ?? "—"}
                      {grupo.encargado && grupo.encargado.de_baja && (
                        <span style={{ color: colors.danger }}>· dado de baja</span>
                      )}
                      {grupo.encargado && grupo.encargado.payment_period && (
                        <CodeBadge
                          code={grupo.encargado.payment_period === "mensual" ? "M" : "Q"}
                          size={13}
                        />
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleGrupo(grupo.key)}
                    className="shrink-0 active:scale-90 transition-transform"
                    style={{
                      color: U ? colors.danger : colors.muted,
                    }}
                  >
                    {U ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="px-5 pt-3 pb-1 space-y-2">
                  <div
                    className="grid grid-cols-[1fr_3rem_4rem_2rem] gap-3 items-center pb-1 border-b eyebrow"
                    style={{
                      borderColor: colors.line,
                      color: colors.muted,
                    }}
                  >
                    <span>Persona</span>
                    <span className="text-right">Horas</span>
                    <span className="text-right border-l border-gray-300 pl-2">Destajo</span>
                    <span />
                  </div>
                  {grupo.empleados.map((XVar) => {
                    const we = trabajadores.find(
                        (trabajador) => trabajador.id === XVar.empleado_id,
                      ),
                      A = editando === XVar.id;
                    return (
                      <div
                        className="grid grid-cols-[1fr_3rem_4rem_2rem] gap-3 items-center border-b border-gray-100 py-1.5 text-sm"
                        key={XVar.id}
                      >
                        <span className="min-w-0 flex items-center gap-2">
                          {U && !XVar.fue_liquidado && (
                            <input
                              type="checkbox"
                              checked={seleccion.has(XVar.id)}
                              onChange={() => toggleSeleccion(XVar.id)}
                              className="shrink-0 w-3.5 h-3.5"
                              style={{
                                accentColor: colors.danger,
                              }}
                            />
                          )}
                          <span className="min-w-0">
                            <span
                              className="truncate flex items-center gap-1"
                              style={{
                                color: XVar.fue_liquidado ? "#9DA19C" : colors.navyDark,
                              }}
                            >
                              {we == null ? undefined : we.nombre}{" "}
                              {we == null ? undefined : we.apellido}
                              {we && (
                                <CodeBadge
                                  code={we.payment_period === "mensual" ? "M" : "Q"}
                                  size={14}
                                />
                              )}
                              {XVar.chofer && <CodeBadge code="C" size={14} />}
                            </span>
                            <span className="flex items-center gap-1 flex-wrap">
                              {XVar.fue_liquidado && (
                                <span
                                  className="text-[11px] font-semibold uppercase"
                                  style={{
                                    color: colors.primary,
                                  }}
                                >
                                  Pagado
                                </span>
                              )}
                            </span>
                          </span>
                        </span>
                        {A ? (
                          <input
                            type="number"
                            autoFocus={true}
                            value={borrador.horas}
                            onChange={(H) =>
                              setBorrador({
                                ...borrador,
                                horas: H.target.value,
                              })
                            }
                            className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-center"
                          />
                        ) : (
                          <span
                            className="text-right text-xs"
                            style={{
                              color: XVar.fue_liquidado ? "#9DA19C" : "#565A57",
                            }}
                          >
                            {XVar.horas}h
                          </span>
                        )}
                        {A ? (
                          <input
                            type="number"
                            value={borrador.destajo}
                            onChange={(H) =>
                              setBorrador({
                                ...borrador,
                                destajo: H.target.value,
                              })
                            }
                            className="w-full px-1 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-center"
                          />
                        ) : (
                          <span
                            className="text-right text-xs border-l border-gray-300 pl-2"
                            style={{
                              color: XVar.fue_liquidado ? "#9DA19C" : "#565A57",
                            }}
                          >
                            €{XVar.destajo}
                          </span>
                        )}
                        {XVar.fue_liquidado ? (
                          <span
                            className="flex justify-end"
                            style={{
                              color: colors.primary,
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : A ? (
                          <div className="flex items-center justify-end -mr-1.5">
                            <button
                              onClick={() => guardarEdicion(XVar.id)}
                              className="p-1.5 active:scale-90"
                              style={{
                                color: colors.primary,
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="p-1.5 text-gray-500 active:scale-90"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditando(XVar.id);
                              setBorrador({
                                horas: String(XVar.horas),
                                destajo: String(XVar.destajo),
                              });
                            }}
                            className="flex justify-end p-1.5 -mr-1.5 text-gray-400 hover:text-gray-700 active:scale-90"
                          >
                            <Pen className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {U && seleccion.size > 0 && (
                    <Button
                      variant="danger"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      className="!mt-2 !py-2 !text-xs"
                      onClick={() => setConfirmarBorrado(true)}
                    >
                      ELIMINAR SELECCIONADOS ({seleccion.size})
                    </Button>
                  )}
                </div>
                {grupo.vehiculo &&
                  temporales.filter(
                    (temporal) =>
                      temporal.fecha === fecha && temporal.vehiculo_id === grupo.vehiculo.id,
                  ).length > 0 && (
                    <div
                      className="px-5 pb-3 pt-2 space-y-1.5 border-t"
                      style={{
                        borderColor: colors.line,
                      }}
                    >
                      <p
                        className="eyebrow"
                        style={{
                          color: colors.muted,
                        }}
                      >
                        Temporales
                      </p>
                      {temporales
                        .filter(
                          (temporal) =>
                            temporal.fecha === fecha && temporal.vehiculo_id === grupo.vehiculo.id,
                        )
                        .map((z) => (
                          <div
                            className="flex items-center justify-between gap-2 text-sm py-1"
                            key={z.id}
                          >
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="truncate"
                                style={{
                                  color: colors.navyDark,
                                }}
                              >
                                {z.nombre_completo}
                              </span>
                              <span
                                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  color: colors.muted,
                                  background: "#F1F1EE",
                                }}
                              >
                                Temporal
                              </span>
                            </span>
                            <span
                              className="text-xs flex-shrink-0"
                              style={{
                                color: colors.muted,
                              }}
                            >
                              €{Number(z.destajo).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            );
          })
        )}
      </div>
      <Sheet
        open={confirmarBorrado}
        title="Eliminar registros seleccionados"
        onClose={() => setConfirmarBorrado(false)}
      >
        <div className="space-y-4">
          <p
            className="text-sm"
            style={{
              color: colors.navyDark,
            }}
          >
            {"Se eliminarán "}
            <strong>{seleccion.size}</strong>
            {" registro(s) del "}
            <strong>{fecha}</strong>:
          </p>
          <ul className="text-xs list-disc list-inside space-y-0.5 text-gray-600 max-h-32 overflow-y-auto">
            {nombresSeleccionados.map((nombresSeleccionado, U) => (
              <li key={U}>{nombresSeleccionado}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-600">Esta acción no se puede deshacer.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmarBorrado(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={eliminarSeleccionados}>
              Eliminar
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
