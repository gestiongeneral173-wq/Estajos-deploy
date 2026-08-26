import { useMemo, useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { importeTemporal } from "../../lib/calculos.js";
import { diaSemana, eur, hoy } from "../../lib/format.js";
import { colors } from "../../theme.js";

/**
 * Una cifra del resumen de cabecera. Etiqueta arriba, número abajo: la misma
 * jerarquía que el resto de Central, para que se lea de un vistazo.
 */
function Total({ etiqueta, valor, destacado = false }) {
  return (
    <div className="text-center">
      <p className="eyebrow" style={{ color: colors.muted }}>
        {etiqueta}
      </p>
      <p
        className={`cifra ${destacado ? "text-sm font-bold" : "text-[13px] font-semibold"}`}
        style={{ color: destacado ? colors.primary : colors.navyDark }}
      >
        {valor}
      </p>
    </div>
  );
}

export function TemporalesModal({ open, onClose, state, actions }) {
  const { temporales, tarifaTemporal } = state,
    [editando, setEditando] = useState(false),
    [valor, setValor] = useState(String(tarifaTemporal)),
    [guardado, setGuardado] = useState(false),
    // Desde 0019 los temporales ya no se borran cada noche: se acumulan hasta
    // que la purga de 60 días se los lleva. Sin filtro, en un mes esto es
    // ilegible.
    [dia, setDia] = useState(""),
    listado = useMemo(
      () =>
        (temporales ?? [])
          .filter((t) => !dia || t.fecha === dia)
          .sort((a, b) =>
            String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")),
          ),
      [temporales, dia],
    ),
    // Los totales salen del mismo `listado` que pinta la tabla, así que se
    // recalculan solos: alta o baja de un temporal y las tres cifras cambian
    // en el mismo render. No hay contador que mantener aparte.
    totales = useMemo(() => {
      const redondear = (n) => Math.round(n * 100) / 100;
      return {
        horas: redondear(
          listado.reduce((n, t) => n + Number(t.horas_trabajadas || 0), 0),
        ),
        destajo: redondear(
          listado.reduce((n, t) => n + Number(t.destajo || 0), 0),
        ),
        // horas × SU tarifa + destajo, temporal a temporal. La misma fórmula
        // que usa el resto de Central para saber qué darle a cada uno.
        pago: redondear(listado.reduce((n, t) => n + importeTemporal(t), 0)),
      };
    }, [listado]),
    valido = parseFloat(valor) > 0,
    guardar = () => {
      actions.setTarifaTemporal(parseFloat(valor) || 0);
      setEditando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    };

  return (
    <Sheet open={open} title="Ver temporales" onClose={onClose}>
      {/* Cabecera: tarifa vigente + su botón de configuración arriba, y debajo
          el resumen de horas y pago. Antes las cifras colgaban del mismo flex
          que el engranaje y se apelotonaban contra el borde derecho. */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        {guardado && (
          <p
            className="text-[11px] mb-2"
            style={{
              color: colors.primary,
            }}
          >
            Tarifa actualizada.
          </p>
        )}
        {editando ? (
          <div className="space-y-2">
            <Input
              label="Tarifa por hora (€)"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(k) => setValor(k.target.value)}
            />
            {valor !== "" && !valido && (
              <p
                className="text-[11px]"
                style={{
                  color: colors.danger,
                }}
              >
                Debe ser mayor a 0.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button variant="primary" disabled={!valido} onClick={guardar}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow text-gray-500">Tarifa de temporales</p>
                <p
                  className="text-sm font-semibold cifra"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  {eur(tarifaTemporal)}/h
                </p>
              </div>
              <button
                onClick={() => {
                  setValor(String(tarifaTemporal));
                  setEditando(true);
                }}
                className="text-gray-500 hover:text-gray-700"
                title="Cambiar la tarifa de temporales"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="eyebrow mb-2" style={{ color: colors.muted }}>
                {dia ? `Totales del ${dia}` : "Totales de todos los temporales"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Total etiqueta="Horas" valor={`${totales.horas}h`} />
                <Total etiqueta="Destajo" valor={eur(totales.destajo)} />
                <Total
                  etiqueta="Pago total"
                  valor={eur(totales.pago)}
                  destacado
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[11px] text-gray-500 mb-3">
          El listado es informativo — el encargado anota horas y destajo, el
          sistema no calcula ningún pago. Se conservan hasta que la limpieza de
          los 60 días se los lleva, o hasta que los elimines aquí.
        </p>
        <div className="flex items-end gap-2 mb-3">
          <div className="flex-1">
            <Input
              label="Día"
              type="date"
              value={dia}
              max={hoy()}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
          {dia && (
            <Button
              variant="outline"
              className="!w-auto px-3"
              onClick={() => setDia("")}
            >
              Todos
            </Button>
          )}
        </div>
        {listado.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-3">
            {dia ? "Sin temporales ese día." : "Sin temporales registrados."}
          </p>
        ) : (
          <div className="space-y-1">
            {/* La tarifa por temporal ya no se lista: es la misma para todos y
                se enseña arriba, en «Tarifa de temporales». */}
            <div className="grid grid-cols-4 gap-1 pb-2 border-b border-gray-100">
              {["Nombre", "Horas", "Destajo", ""].map((k, N) => (
                <p
                  className="eyebrow text-gray-500 text-center first:text-left"
                  key={N}
                >
                  {k}
                </p>
              ))}
            </div>
            {listado.map((temporal) => (
              <div
                className="grid grid-cols-4 gap-1 py-1.5 border-b border-gray-50 last:border-0 items-center"
                key={temporal.id}
              >
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-semibold truncate"
                    style={{
                      color: colors.navyDark,
                    }}
                  >
                    {temporal.nombre_completo}
                  </p>
                  {temporal.fecha && (
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <span
                        className="eyebrow"
                        style={{
                          color: diaSemana(temporal.fecha)?.finde
                            ? colors.danger
                            : colors.muted,
                        }}
                      >
                        {diaSemana(temporal.fecha)?.letra}
                      </span>
                      {temporal.fecha}
                    </p>
                  )}
                </div>
                <p
                  className="text-[11px] text-center"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  {temporal.horas_trabajadas}h
                </p>
                <p
                  className="text-[11px] text-center"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  {eur(temporal.destajo)}
                </p>
                <button
                  onClick={() => actions.eliminarTemporal(temporal.id)}
                  className="flex justify-end text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {temporales.length > 0 && (
          <Button
            variant="danger"
            className="mt-3"
            onClick={actions.eliminarTodosLosTemporales}
          >
            Eliminar todos
          </Button>
        )}
      </div>
    </Sheet>
  );
}
