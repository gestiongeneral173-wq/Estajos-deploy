import { useMemo, useState } from "react";
import { CircleUser, Search, X } from "lucide-react";
import { AvatarIcon } from "../components/ui/primitives.jsx";
import { normalizar } from "../lib/format.js";
import { colors } from "../theme.js";

export function PersonaPicker({ personas, onPick, buscador = false }) {
  const [q, setQ] = useState(""),
    lista = useMemo(() => {
      if (!buscador) {
        return personas;
      }
      const o = normalizar(q).trim();
      return o
        ? personas.filter((persona) => normalizar(persona.nombre).includes(o))
        : personas;
    }, [personas, q, buscador]);
  return personas.length === 0 ? (
    <p className="text-gray-500 text-xs text-center py-3">
      No quedan personas disponibles.
    </p>
  ) : (
    <div>
      {buscador && (
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={q}
            onChange={(o) => setQ(o.target.value)}
            placeholder="Buscar persona por nombre"
            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            style={{
              color: colors.navyDark,
            }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 active:scale-90 transition-transform"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {lista.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            Nadie coincide con “{q}”.
          </p>
        ) : (
          lista.map((o) => (
            <button
              onClick={() => onPick(o.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
              key={o.id}
            >
              <AvatarIcon icon={CircleUser} size={26} />
              <span
                className="flex-1 min-w-0 text-sm truncate"
                style={{
                  color: colors.navyDark,
                }}
              >
                {o.nombre}
              </span>
            </button>
          ))
        )}
      </div>
      {buscador && (
        <p className="text-[11px] text-gray-500 text-center mt-2">
          {lista.length}
          {" de "}
          {personas.length}
          {" disponibles"}
        </p>
      )}
    </div>
  );
}
