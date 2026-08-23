import { CodeBadges } from "../components/ui/Badges.jsx";
import { Card, Num, StatusDot } from "../components/ui/primitives.jsx";
import { nombrePersona } from "./useCampo.js";
import { rosterToList } from "../lib/calculos.js";
import { colors } from "../theme.js";

export function FurgonetaCard({ furgoneta, roster, personas }) {
  const filas = rosterToList(roster),
    totalHoras = filas.reduce((s, fila) => s + (fila.horas || 0), 0),
    totalDestajo = filas.reduce((s, fila) => s + (fila.destajo || 0), 0);
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-baseline gap-2 px-5 pt-4 pb-3">
        <p
          className="font-semibold text-[17px] tracking-tight"
          style={{
            color: colors.navyDark,
          }}
        >
          {furgoneta.nombre}
        </p>
        <span
          className="text-[11px] flex-1"
          style={{
            color: colors.muted,
          }}
        >
          <span className="cifra">{filas.length}</span>/
          <span className="cifra">{furgoneta.plazas}</span>
          {" plazas"}
        </span>
        <span
          className="flex items-center gap-1.5 text-[11px]"
          style={{
            color: colors.muted,
          }}
        >
          <StatusDot tone="ok" />
          {" Cerrada"}
        </span>
      </div>
      <div className="px-5 pb-1">
        <div
          className="flex items-center gap-2 pb-2 border-b"
          style={{
            borderColor: colors.line,
          }}
        >
          <span
            className="eyebrow flex-1"
            style={{
              color: "#9DA19C",
            }}
          >
            Persona
          </span>
          <span
            className="eyebrow w-9 text-right"
            style={{
              color: "#9DA19C",
            }}
          >
            Horas
          </span>
          <span
            className="eyebrow w-12 text-right"
            style={{
              color: "#9DA19C",
            }}
          >
            Destajo
          </span>
        </div>
        <div>
          {filas.map((fila) => (
            <div className="flex items-center gap-2 py-2.5" key={fila.id}>
              <span className="flex-1 min-w-0 flex items-center gap-1.5">
                <span
                  className="text-sm truncate"
                  style={{
                    color: colors.navyDark,
                  }}
                >
                  {nombrePersona(personas, fila.id)}
                </span>
                <CodeBadges codes={fila.roles} size={15} />
              </span>
              <Num className="w-9 text-right">{fila.horas ?? 0}</Num>
              <Num className="w-12 text-right">€{fila.destajo ?? 0}</Num>
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-5 py-3 border-t"
        style={{
          borderColor: colors.line,
        }}
      >
        <span
          className="eyebrow flex-1"
          style={{
            color: colors.muted,
          }}
        >
          Total
        </span>
        <Num tone="strong" className="w-9 text-right font-medium">
          {totalHoras}
        </Num>
        <Num tone="strong" className="w-12 text-right font-medium">
          €{totalDestajo}
        </Num>
      </div>
    </Card>
  );
}
