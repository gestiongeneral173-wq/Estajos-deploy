import { useMemo, useState } from "react";
import { Check, Copy, KeyRound, Search, Trash2 } from "lucide-react";

import { CodeBadge } from "../../components/ui/Badges.jsx";
import { Button, Input, Sheet } from "../../components/ui/primitives.jsx";
import { colors, hexToRgba } from "../../theme.js";

// Desde 0021 los PINes no caducan: `expira_at` llega como "infinity", que
// `new Date` no sabe leer. Devuelve null y quien pinta decide si enseña algo.
const fechaCorta = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    : null;
};

/**
 * Dar un PIN es lo que convierte a alguien en encargado, así que se elige
 * de entre todo el padrón.
 *
 * El PIN queda a la vista en la lista de PINs activos: Central lo necesita
 * para poder decírselo al encargado que lo ha olvidado. La base sigue
 * guardando el hash bcrypt aparte, que es contra lo que se comprueba al
 * entrar en Campo.
 */
export function GenerarPinesModal({ open, onClose, state, actions }) {
  const { trabajadores, pinesEncargado } = state;
  const [q, setQ] = useState("");
  const [seleccion, setSeleccion] = useState(new Set());
  const [generados, setGenerados] = useState(null);
  const [copiado, setCopiado] = useState(null);
  const [generando, setGenerando] = useState(false);

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return trabajadores.filter(
      (t) =>
        !texto || `${t.nombre} ${t.apellido}`.toLowerCase().includes(texto),
    );
  }, [trabajadores, q]);

  const toggleSeleccion = (id) =>
    setSeleccion((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const generar = async () => {
    const ids = [...seleccion];
    if (!ids.length) return;
    setGenerando(true);
    try {
      setGenerados(await actions.generarPinesEncargado(ids));
      setSeleccion(new Set());
    } catch {
      // El aviso lo pinta CentralApp a partir del error del store.
    } finally {
      setGenerando(false);
    }
  };

  const copiar = (id, texto) => {
    try {
      navigator.clipboard?.writeText(texto);
    } catch {
      /* sin portapapeles: el PIN sigue a la vista */
    }
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1200);
  };

  const nombreDe = (id) => {
    const t = trabajadores.find((x) => x.id === id);
    return t ? `${t.nombre} ${t.apellido}` : "—";
  };

  const cerrar = () => {
    setQ("");
    setSeleccion(new Set());
    setGenerados(null);
    onClose();
  };

  return (
    <Sheet open={open} title="Generar PIN de encargados" onClose={cerrar}>
      <div className="space-y-4">
        {generados && (
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              background: hexToRgba(colors.gold, 0.1),
              border: `1px solid ${hexToRgba(colors.gold, 0.3)}`,
            }}
          >
            <p className="eyebrow text-gray-600">PIN generado</p>
            <p className="text-[11px] text-gray-600 -mt-1">
              Queda a la vista en «PINs activos». Si hace falta otro, se genera
              y el anterior deja de valer.
            </p>

            {generados.map(({ empleado_id, pin }) => {
              const t = trabajadores.find((x) => x.id === empleado_id);
              return (
                <div
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                  key={empleado_id}
                >
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate flex items-center gap-1.5"
                      style={{ color: colors.navyDark }}
                    >
                      {nombreDe(empleado_id)}
                      {t && (
                        <CodeBadge
                          code={t.payment_period === "mensual" ? "M" : "Q"}
                          size={14}
                        />
                      )}
                    </p>
                    <p
                      className="text-lg font-semibold tracking-widest cifra"
                      style={{ color: colors.navyDark }}
                    >
                      {pin}
                    </p>
                  </div>
                  <button
                    onClick={() => copiar(empleado_id, pin)}
                    className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                    style={{ color: colors.primary }}
                  >
                    {copiado === empleado_id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiado === empleado_id ? "Copiado" : "Copiar"}
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setGenerados(null)}
              className="w-full text-gray-600 text-xs pt-1"
            >
              Generar más
            </button>
          </div>
        )}

        {!generados && (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Buscar en el padrón…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="!pl-9"
              />
            </div>

            {filtrados.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">
                {q ? "Sin coincidencias." : "No hay trabajadores en el padrón."}
              </p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {filtrados.map((t, i) => {
                  const yaTiene = pinesEncargado.some(
                    (p) => p.empleado_id === t.id,
                  );
                  return (
                    <label
                      className="grid grid-cols-[auto_1fr_auto] gap-2 p-2 border-t border-gray-100 first:border-t-0 items-center text-xs"
                      style={{
                        background: seleccion.has(t.id)
                          ? hexToRgba(colors.primary, 0.08)
                          : i % 2
                            ? "#F8F8F6"
                            : "#fff",
                      }}
                      key={t.id}
                    >
                      <input
                        type="checkbox"
                        checked={seleccion.has(t.id)}
                        onChange={() => toggleSeleccion(t.id)}
                      />
                      <span
                        className="truncate flex items-center gap-1.5"
                        style={{ color: colors.navyDark }}
                      >
                        {t.nombre} {t.apellido}
                        <CodeBadge
                          code={t.payment_period === "mensual" ? "M" : "Q"}
                          size={14}
                        />
                      </span>
                      {yaTiene && (
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: "#3C403E" }}
                        >
                          ya tiene PIN
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <Button
              variant="primary"
              icon={<KeyRound className="w-4 h-4" />}
              disabled={seleccion.size === 0 || generando}
              onClick={generar}
            >
              {generando ? "GENERANDO…" : `GENERAR PIN (${seleccion.size})`}
            </Button>
            <p className="text-[11px] text-gray-500 text-center -mt-1">
              Generar un PIN nuevo anula el anterior de esa persona.
            </p>
          </>
        )}

        <div className="bg-gray-50 rounded-xl p-3">
          <p className="eyebrow text-gray-500 mb-2">PINs activos</p>
          {pinesEncargado.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-3">
              No hay PINs activos.
            </p>
          ) : (
            <div className="space-y-1">
              {pinesEncargado.map((p) => {
                const t = trabajadores.find((x) => x.id === p.empleado_id);
                return (
                  <div
                    className="grid grid-cols-[1fr_auto_auto] gap-2 py-1.5 border-b border-gray-100 last:border-0 items-center"
                    key={p.id}
                  >
                    <p
                      className="text-[11px] font-semibold truncate flex items-center gap-1.5"
                      style={{ color: colors.navyDark }}
                    >
                      {p.nombre ?? nombreDe(p.empleado_id)}
                      {t && (
                        <CodeBadge
                          code={t.payment_period === "mensual" ? "M" : "Q"}
                          size={14}
                        />
                      )}
                    </p>
                    <p
                      className="text-[11px] font-semibold tracking-widest cifra"
                      style={{ color: colors.navyDark }}
                      title={
                        fechaCorta(p.expira_at)
                          ? `Caduca el ${fechaCorta(p.expira_at)}`
                          : "No caduca"
                      }
                    >
                      {p.pin}
                    </p>
                    <div className="flex items-center gap-2">
                      {fechaCorta(p.expira_at) && (
                        <span
                          className="text-[10px]"
                          style={{ color: colors.muted }}
                        >
                          cad. {fechaCorta(p.expira_at)}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          actions.eliminarPinEncargado(p.empleado_id)
                        }
                        aria-label={`Revocar el PIN de ${p.nombre ?? nombreDe(p.empleado_id)}`}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
