import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { CodeBadge } from "../components/ui/Badges.jsx";
import { Button, Input } from "../components/ui/primitives.jsx";
import { colors } from "../theme.js";

/**
 * El único rol que se elige aquí es el de chofer. El encargado del parte
 * es quien ha entrado con su PIN, así que no hay nada que marcar.
 */
export function JornadaModal({ open, nombre, choferTomado, onCancel, onConfirm }) {
  const [horas, setHoras] = useState("8");
  const [destajo, setDestajo] = useState("0");
  const [esChofer, setEsChofer] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHoras("8");
    setDestajo("0");
    setEsChofer(false);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-5"
      style={{
        background: "rgba(28,38,33,0.5)",
      }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl px-5 pb-6 pt-3 sm:pt-5 shadow-sheet w-full sm:max-w-sm"
        onClick={(u) => u.stopPropagation()}
        style={{
          animation: "slideUp 220ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className="w-9 h-1 rounded-full mx-auto mb-4 sm:hidden"
          style={{
            background: colors.line,
          }}
        />
        <p
          className="eyebrow"
          style={{
            color: colors.muted,
          }}
        >
          Jornada de
        </p>
        <p
          className="text-lg font-semibold truncate mt-0.5 mb-4"
          style={{
            color: colors.navyDark,
          }}
        >
          {nombre}
        </p>
        {/* Antes era un botón que sólo cambiaba el color del borde 1px al
            marcarlo: no se veía si estaba puesto o no. Ahora se lee como el
            interruptor que es. */}
        <button
          type="button"
          role="switch"
          aria-checked={esChofer}
          onClick={() => !choferTomado && setEsChofer((v) => !v)}
          disabled={choferTomado}
          className="w-full rounded-xl p-3 flex items-center gap-2.5 mb-4 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            border: `1px solid ${esChofer ? colors.navyDark : colors.line}`,
            background: esChofer ? colors.navyDark : "#fff",
          }}
        >
          <CodeBadge code="C" size={20} />
          <span className="flex-1 text-left">
            <span
              className="block text-[13px] font-semibold"
              style={{ color: esChofer ? "#fff" : colors.navyDark }}
            >
              {choferTomado ? "Chofer ya asignado" : "Conduce la furgoneta"}
            </span>
            {!choferTomado && (
              <span
                className="block text-[11px] mt-0.5"
                style={{ color: esChofer ? "rgba(255,255,255,0.7)" : colors.muted }}
              >
                {esChofer ? "Sí · cobra tarifa de chofer" : "No · toca para marcarlo"}
              </span>
            )}
          </span>
          {esChofer && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#fff" }} />}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Horas"
            type="number"
            inputMode="decimal"
            value={horas}
            onChange={(u) => setHoras(u.target.value)}
            className="cifra"
          />
          <Input
            label="Destajo €"
            type="number"
            inputMode="decimal"
            value={destajo}
            onChange={(u) => setDestajo(u.target.value)}
            className="cifra"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onConfirm(parseFloat(horas) || 0, parseFloat(destajo) || 0, esChofer ? ["C"] : [])
            }
          >
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}
