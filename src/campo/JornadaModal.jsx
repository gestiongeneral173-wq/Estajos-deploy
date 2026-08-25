import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { CodeBadge } from "../components/ui/Badges.jsx";
import { Button, Input } from "../components/ui/primitives.jsx";
import { colors } from "../theme.js";

/**
 * Los dos roles se marcan aquí y son independientes: el chofer es obligatorio
 * (el parte no sale sin uno) y el encargado a bordo es opcional. Uno de cada
 * por furgoneta; la misma persona puede llevar los dos.
 *
 * Con `acompletar` ({ horas, destajo } de la jornada que ya está guardada) el
 * modal cambia de oficio: no da de alta a nadie, solo deja rellenar el campo
 * que se quedó en cero. El que ya vale algo se enseña, pero no se toca.
 */
export function JornadaModal({
  open,
  nombre,
  choferTomado,
  encargadoTomado,
  acompletar,
  onCancel,
  onConfirm,
}) {
  const modo = acompletar ? "acompletar" : "alta";
  const [horas, setHoras] = useState("0");
  const [destajo, setDestajo] = useState("0");
  const [esChofer, setEsChofer] = useState(false);
  const [esEncargado, setEsEncargado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHoras(modo === "acompletar" ? "" : "0");
    setDestajo(modo === "acompletar" ? "" : "0");
    setEsChofer(false);
    setEsEncargado(false);
  }, [open, modo]);

  if (!open) return null;
  const editaHoras = modo === "alta" || acompletar.horas === 0,
    editaDestajo = modo === "alta" || acompletar.destajo === 0,
    // Hay que teclear una cifra que valga algo (horas o destajo) antes de
    // poder guardar, tanto al dar de alta como al acompletar.
    puedeGuardar =
      modo === "alta"
        ? parseFloat(horas) > 0 || parseFloat(destajo) > 0
        : editaHoras
          ? parseFloat(horas) > 0
          : parseFloat(destajo) > 0;
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
          {modo === "acompletar" ? "Acompletar jornada de" : "Jornada de"}
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
        {modo === "alta" && (
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
                  style={{
                    color: esChofer ? "rgba(255,255,255,0.7)" : colors.muted,
                  }}
                >
                  {esChofer
                    ? "Sí · cobra tarifa de chofer"
                    : "No · toca para marcarlo"}
                </span>
              )}
            </span>
            {esChofer && (
              <Check
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#fff" }}
              />
            )}
          </button>
        )}
        {modo === "alta" && (
          <button
            type="button"
            role="switch"
            aria-checked={esEncargado}
            onClick={() => !encargadoTomado && setEsEncargado((v) => !v)}
            disabled={encargadoTomado}
            className="w-full rounded-xl p-3 flex items-center gap-2.5 mb-4 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${esEncargado ? colors.navyDark : colors.line}`,
              background: esEncargado ? colors.navyDark : "#fff",
            }}
          >
            <CodeBadge code="E" size={20} />
            <span className="flex-1 text-left">
              <span
                className="block text-[13px] font-semibold"
                style={{ color: esEncargado ? "#fff" : colors.navyDark }}
              >
                {encargadoTomado ? "Encargado ya asignado" : "Va de encargado"}
              </span>
              {!encargadoTomado && (
                <span
                  className="block text-[11px] mt-0.5"
                  style={{
                    color: esEncargado ? "rgba(255,255,255,0.7)" : colors.muted,
                  }}
                >
                  {esEncargado
                    ? "Sí · lleva el equipo"
                    : "Opcional · toca para marcarlo"}
                </span>
              )}
            </span>
            {esEncargado && (
              <Check
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#fff" }}
              />
            )}
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          {editaHoras ? (
            <Input
              label="Horas"
              type="number"
              min="0"
              inputMode="decimal"
              value={horas}
              onChange={(u) => setHoras(u.target.value)}
              className="cifra"
              autoFocus={modo === "acompletar"}
            />
          ) : (
            <Fijo label="Horas" valor={`${acompletar.horas}h`} />
          )}
          {editaDestajo ? (
            <Input
              label="Destajo €"
              type="number"
              min="0"
              inputMode="decimal"
              value={destajo}
              onChange={(u) => setDestajo(u.target.value)}
              className="cifra"
              autoFocus={modo === "acompletar" && !editaHoras}
            />
          ) : (
            <Fijo label="Destajo €" valor={`€${acompletar.destajo}`} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!puedeGuardar}
            onClick={() =>
              onConfirm(parseFloat(horas) || 0, parseFloat(destajo) || 0, [
                ...(esEncargado ? ["E"] : []),
                ...(esChofer ? ["C"] : []),
              ])
            }
          >
            {modo === "acompletar" ? "Guardar" : "Añadir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Lo que ya está guardado y no se puede cambiar: se enseña, no se edita. */
function Fijo({ label, valor }) {
  return (
    <div>
      <span className="eyebrow block mb-2" style={{ color: colors.muted }}>
        {label}
      </span>
      <div
        className="w-full min-h-[46px] px-3.5 flex items-center rounded-lg text-sm cifra"
        style={{ background: "#F5F6F4", color: colors.muted }}
      >
        {valor}
      </div>
    </div>
  );
}
