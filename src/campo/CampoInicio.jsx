import { useRef, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { FurgonetaCard } from "./FurgonetaCard.jsx";
import { AppHeader } from "../components/AppHeader.jsx";
import { Button, Card, StatusDot } from "../components/ui/primitives.jsx";
import { rosterToList } from "../lib/calculos.js";
import { formatFecha, hoy } from "../lib/format.js";
import { colors, hexToRgba } from "../theme.js";

export function CampoInicio({ registrosCampo, vehiculos, personas, onLogout, onAbrirRegistro }) {
  const HOY = hoy();
  const fechaInputRef = useRef(null);
  const [fecha, setFecha] = useState(HOY),
    delDia = registrosCampo[fecha] || {},
    cerradas = vehiculos.filter((vehiculo) => delDia[vehiculo.id]),
    pendientes = vehiculos.filter((vehiculo) => !delDia[vehiculo.id]),
    totalPersonas = cerradas.reduce((i, cerrada) => i + rosterToList(delDia[cerrada.id]).length, 0);
  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: colors.appBg,
      }}
    >
      <AppHeader onLogout={onLogout} />
      <div className="px-4 sm:px-6 lg:px-8 pt-7 sm:pt-9 lg:pt-12 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="mb-6">
          <p
            className="eyebrow"
            style={{
              color: colors.muted,
            }}
          >
            Parte del día
          </p>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <h1
              className="text-[26px] font-semibold tracking-tight leading-none"
              style={{
                color: colors.navyDark,
              }}
            >
              {formatFecha(fecha)}
            </h1>
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => fechaInputRef.current?.showPicker?.()}
                className="w-10 h-10 rounded-xl border flex items-center justify-center bg-white"
                style={{
                  borderColor: colors.line,
                  color: colors.navyDark,
                }}
                aria-label="Ver fecha anterior"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <input
                ref={fechaInputRef}
                type="date"
                value={fecha}
                max={HOY}
                aria-hidden="true"
                tabIndex={-1}
                onChange={(i) => setFecha(i.target.value || HOY)}
                className="absolute w-px h-px opacity-0 pointer-events-none"
              />
            </div>
          </div>
          <p
            className="text-[13px] mt-2.5"
            style={{
              color: colors.muted,
            }}
          >
            <span className="cifra">{cerradas.length}</span>
            {" de "}
            <span className="cifra">{vehiculos.length}</span>
            {" furgonetas cerradas"}
            {totalPersonas > 0 && (
              <>
                {" · "}
                <span className="cifra">{totalPersonas}</span>
                {" personas"}
              </>
            )}
          </p>
          {fecha !== HOY && (
            <button
              onClick={() => setFecha(HOY)}
              className="text-[12px] font-medium mt-2"
              style={{
                color: colors.primary,
              }}
            >
              ← Volver a hoy
            </button>
          )}
        </div>
        {pendientes.length > 0 && (
          <div
            className="mb-4 flex items-center gap-2.5 flex-wrap py-3 px-4 rounded-xl bg-white border"
            style={{
              borderColor: colors.line,
            }}
          >
            <span
              className="eyebrow"
              style={{
                color: colors.muted,
              }}
            >
              Sin registrar
            </span>
            {pendientes.map((pendient) => (
              <span
                className="flex items-center gap-1.5 text-[13px]"
                style={{
                  color: colors.navyDark,
                }}
                key={pendient.id}
              >
                <StatusDot tone="pendiente" /> {pendient.nombre}
              </span>
            ))}
          </div>
        )}
        {cerradas.length === 0 ? (
          <Card className="text-center py-14">
            <p
              className="text-[15px] font-medium"
              style={{
                color: colors.navyDark,
              }}
            >
              {fecha === HOY
                ? "Todavía no hay partes de hoy"
                : "No hay partes registrados este día"}
            </p>
            <p
              className="text-[13px] mt-1.5"
              style={{
                color: colors.muted,
              }}
            >
              {fecha === HOY
                ? "Registra la primera furgoneta desde el botón de abajo."
                : "Prueba con otra fecha."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {cerradas.map((cerrada) => (
              <FurgonetaCard
                furgoneta={cerrada}
                roster={delDia[cerrada.id]}
                personas={personas}
                key={cerrada.id}
              />
            ))}
          </div>
        )}
      </div>
      <div
        className="fixed bottom-0 inset-x-0 z-20 px-4 sm:px-6 lg:px-8 pt-4"
        style={{
          paddingBottom: "calc(0.9rem + env(safe-area-inset-bottom, 0px))",
          background: `linear-gradient(to top, ${colors.appBg} 68%, ${hexToRgba(colors.appBg, 0)})`,
        }}
      >
        <div className="max-w-md sm:max-w-sm mx-auto">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAbrirRegistro}
            className="shadow-raised"
          >
            Registrar furgoneta
          </Button>
        </div>
      </div>
    </div>
  );
}
