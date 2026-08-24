import { useEffect, useState } from "react";
import { Button, Input } from "../components/ui/primitives.jsx";
import { colors } from "../theme.js";

export function TemporalModal({ open, onCancel, onConfirm }) {
  const [nombre, setNombre] = useState(""),
    [horas, setHoras] = useState("0"),
    [destajo, setDestajo] = useState("0");
  useEffect(() => {
    open && (setNombre(""), setHoras("0"), setDestajo("0"));
  }, [open]);
  if (!open) {
    return null;
  }
  // Un temporal se apunta como cualquiera: nombre, horas y destajo. Y como
  // cualquier jornada, tiene que valer algo — la base rechaza la que no.
  const valido =
    nombre.trim().length > 0 &&
    ((parseFloat(horas) || 0) > 0 || (parseFloat(destajo) || 0) > 0);
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
          Personal temporal
        </p>
        <p
          className="text-lg font-semibold mt-0.5 mb-4"
          style={{
            color: colors.navyDark,
          }}
        >
          Añadir temporal
        </p>
        <div className="space-y-3">
          <Input
            label="Nombre"
            type="text"
            value={nombre}
            onChange={(u) => setNombre(u.target.value)}
            autoFocus={true}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horas"
              type="number"
              min="0"
              inputMode="decimal"
              value={horas}
              onChange={(u) => setHoras(u.target.value)}
              className="cifra"
            />
            <Input
              label="Destajo €"
              type="number"
              min="0"
              inputMode="decimal"
              value={destajo}
              onChange={(u) => setDestajo(u.target.value)}
              className="cifra"
            />
          </div>
        </div>
        <p
          className="text-[11px] mt-3"
          style={{
            color: colors.muted,
          }}
        >
          No aparecerá en el listado de la furgoneta, pero sí quedará registrado
          para Central.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!valido}
            onClick={() =>
              onConfirm(
                nombre.trim(),
                parseFloat(horas) || 0,
                parseFloat(destajo) || 0,
              )
            }
          >
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}
