import { ChevronRight } from "lucide-react";
import { CodeBadge } from "../components/ui/Badges.jsx";
import { colors } from "../theme.js";

export function WorkerRow({ worker, onClick, modoEncargados = false }) {
  const { nombre, telefono, paymentPeriod, balance = 0, es_encargado: esEncargado, pin } = worker,
    tieneSaldo = Number(balance) > 0;
  return (
    <button
      onClick={() => (onClick == null ? undefined : onClick(worker))}
      className="w-full bg-white rounded-xl px-4 py-3.5 border text-left transition-shadow flex items-center gap-3 active:scale-[0.99] card-interactiva"
      style={{
        borderColor: colors.line,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="font-medium text-[15px] truncate"
            style={{
              color: colors.navyDark,
            }}
          >
            {nombre}
          </p>
          <CodeBadge code={paymentPeriod === "mensual" ? "M" : "Q"} size={16} />
          {esEncargado && <CodeBadge code="E" size={16} />}
        </div>
        <p
          className="text-[11px] cifra mt-1"
          style={{
            color: colors.muted,
          }}
        >
          {telefono}
          {pin && (
            <>
              {" · PIN "}
              {pin}
            </>
          )}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        {modoEncargados ? (
          <>
            <p
              className="cifra text-[15px] font-medium"
              style={{
                color: colors.navyDark,
              }}
            >
              {pin ?? "—"}
            </p>
            <p
              className="text-[11px]"
              style={{
                color: colors.muted,
              }}
            >
              PIN de acceso
            </p>
          </>
        ) : (
          <>
            <p
              className="cifra text-[15px] font-medium"
              style={{
                color: tieneSaldo ? colors.navyDark : "#9DA19C",
              }}
            >
              €{Number(balance).toFixed(0)}
            </p>
            <p
              className="text-[11px]"
              style={{
                color: colors.muted,
              }}
            >
              {tieneSaldo ? "por pagar" : "al día"}
            </p>
          </>
        )}
      </div>
      <ChevronRight
        className="w-4 h-4 flex-shrink-0"
        style={{
          color: "#CFD1CC",
        }}
      />
    </button>
  );
}
