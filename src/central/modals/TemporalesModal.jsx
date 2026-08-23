import { useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors } from "../../theme.js";

export function TemporalesModal({ open, onClose, state, actions }) {
  const { temporales, tarifaTemporal } = state,
    // Qué temporal tiene la tarifa abierta para editar, y con qué valor.
    [tarifaDe, setTarifaDe] = useState(null),
    [tarifaValor, setTarifaValor] = useState(""),
    [editando, setEditando] = useState(false),
    [valor, setValor] = useState(String(tarifaTemporal)),
    [guardado, setGuardado] = useState(false),
    valido = parseFloat(valor) > 0,
    guardar = () => {
      actions.setTarifaTemporal(parseFloat(valor) || 0);
      setEditando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1500);
    };
  return (
    <Sheet open={open} title="Ver temporales" onClose={onClose}>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-gray-500">Tarifa de temporales</p>
              <p
                className="text-sm font-semibold"
                style={{
                  color: colors.navyDark,
                }}
              >
                €{Number(tarifaTemporal || 0).toFixed(2)}/h
              </p>
            </div>
            <button
              onClick={() => {
                setValor(String(tarifaTemporal));
                setEditando(true);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[11px] text-gray-500 mb-3">
          El listado es informativo — el encargado anota horas y destajo, el sistema no calcula
          ningún pago. Los de días anteriores se borran solos cada noche; los de hoy siguen aquí
          hasta que pase el día o los elimines.
        </p>
        {temporales.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-3">Sin temporales registrados hoy.</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-1 pb-2 border-b border-gray-100">
              {["Nombre", "Horas", "Destajo", "Tarifa", ""].map((k, N) => (
                <p className="eyebrow text-gray-500 text-center first:text-left" key={N}>
                  {k}
                </p>
              ))}
            </div>
            {temporales.map((temporal) => (
              <div
                className="grid grid-cols-5 gap-1 py-1.5 border-b border-gray-50 last:border-0 items-center"
                key={temporal.id}
              >
                <p
                  className="text-[11px] font-semibold truncate"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  {temporal.nombre_completo}
                </p>
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
                  €{Number(temporal.destajo).toFixed(2)}
                </p>
                {/* La tarifa se copió al crearlo; a partir de ahí es suya y se
                    corrige aquí sin tocar la de configuración. */}
                {tarifaDe === temporal.id ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    value={tarifaValor}
                    onChange={(k) => setTarifaValor(k.target.value)}
                    onBlur={() => {
                      const n = parseFloat(tarifaValor);
                      if (n >= 0 && n !== temporal.tarifa_hora) {
                        actions.editarTarifaTemporal(temporal.id, n);
                      }
                      setTarifaDe(null);
                    }}
                    className="text-[11px] text-center w-full border border-gray-200 rounded px-1 py-0.5"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setTarifaDe(temporal.id);
                      setTarifaValor(String(temporal.tarifa_hora ?? 0));
                    }}
                    className="text-[11px] text-center underline decoration-dotted"
                    style={{ color: colors.navyDark }}
                    title="Editar la tarifa de este temporal"
                  >
                    €{Number(temporal.tarifa_hora ?? 0).toFixed(2)}
                  </button>
                )}
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
          <Button variant="danger" className="mt-3" onClick={actions.eliminarTodosLosTemporales}>
            Eliminar todos
          </Button>
        )}
      </div>
    </Sheet>
  );
}
