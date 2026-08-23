import { useEffect, useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";

import { useAuth } from "../auth/AuthProvider.jsx";
import { colors } from "../theme.js";

/**
 * Acceso de campo. El PIN no se compara aquí ni viaja a la base desde el
 * navegador: lo canjea la Edge Function `campo-login`, que es la única que
 * puede leer los hashes. Si es correcto, vuelve una sesión de Supabase.
 */
export function PinLogin({ onOpenCentral }) {
  const { entrarConPin } = useAuth();
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(null);
  const [comprobando, setComprobando] = useState(false);

  // `comprobando` NO va en las dependencias a propósito: al ponerlo a true
  // React limpiaba este mismo efecto, `cancelado` se quedaba en true antes de
  // que respondiera el servidor y ni se enseñaba el error ni se volvía a
  // poner a false — el teclado se quedaba clavado en "Comprobando…" para
  // siempre en cuanto se fallaba un PIN una vez.
  useEffect(() => {
    if (pin.length !== 4) return;

    let vivo = true;
    setComprobando(true);

    // Si va bien no hay nada que hacer aquí: AuthProvider cambia la sesión
    // y App repinta con la pantalla de campo.
    entrarConPin(pin)
      .catch((e) => {
        if (!vivo) return;
        setError(e.message);
        setShake(true);
        setTimeout(() => {
          if (!vivo) return;
          setShake(false);
          setPin("");
        }, 420);
      })
      .finally(() => {
        if (vivo) setComprobando(false);
      });

    return () => {
      vivo = false;
    };
  }, [pin, entrarConPin]);

  const pulsar = (digito) => {
    if (comprobando || pin.length >= 4) return;
    setError(null);
    setPin((p) => p + digito);
  };
  const borrar = () => !comprobando && setPin((p) => p.slice(0, -1));

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 pt-20 pb-8"
      style={{ background: colors.appBg }}
    >
      <h1
        className="font-semibold tracking-[0.3em]"
        style={{ color: colors.navyDark, fontSize: 15 }}
      >
        ESTAJOS
      </h1>
      <p
        className="text-[13px] mt-3 text-center min-h-[18px] px-6"
        style={{ color: error ? colors.danger : colors.muted }}
      >
        {comprobando ? "Comprobando…" : (error ?? "Introduce tu PIN de encargado")}
      </p>

      <div className={`flex gap-2.5 my-9 ${shake ? "animate-[shake_0.4s]" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: i < pin.length ? colors.navyDark : colors.line }}
            key={i}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-[276px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            onClick={() => pulsar(d)}
            disabled={comprobando}
            className="aspect-square rounded-xl text-xl cifra bg-white border flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
            style={{ borderColor: colors.line, color: colors.navyDark }}
            key={d}
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => pulsar("0")}
          disabled={comprobando}
          className="aspect-square rounded-xl text-xl cifra bg-white border flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
          style={{ borderColor: colors.line, color: colors.navyDark }}
        >
          0
        </button>
        <button
          onClick={borrar}
          disabled={comprobando}
          aria-label="Borrar"
          className="aspect-square rounded-xl flex items-center justify-center active:scale-95 transition-all"
          style={{ color: pin.length ? colors.muted : "#CFD1CC" }}
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onOpenCentral}
        className="flex items-center gap-1.5 text-[13px] font-medium min-h-[44px] px-4 transition-colors"
        style={{ color: colors.muted }}
      >
        <ShieldCheck className="w-4 h-4" />
        Acceso Central
      </button>
    </div>
  );
}
