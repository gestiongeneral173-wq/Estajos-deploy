import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "./AuthProvider.jsx";
import { Button, Input } from "../components/ui/primitives.jsx";
import { colors } from "../theme.js";

// La firma de los que hicieron esto. No abre nada ni llama a nadie: sólo se
// enseñan y se mueven. Escribe la contraseña al revés del usuario y salen.
const CONJURO = ["camaron caramelo", "caramelo camaron"];
// Los gif ya se mueven solos; el vaivén de abajo sólo los pasea. Cada uno mide
// lo suyo, así que se pintan a tamaño natural y apoyados en la misma línea.
const AUTORES = [
  { nombre: "will", sprite: "/sprites/cubone.gif" },
  { nombre: "nano", sprite: "/sprites/gengar.gif" },
  { nombre: "palomo", sprite: "/sprites/lucario.gif" },
];

/**
 * Acceso de Central: correo y contraseña contra Supabase Auth. La
 * contraseña nunca pasa por la aplicación ni por la base de negocio; la
 * gestiona GoTrue entera.
 */
export function LoginCentral({ onCancel }) {
  const { entrarCentral } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [entrando, setEntrando] = useState(false);
  const conjurado =
    correo.trim().toLowerCase() === CONJURO[0] &&
    password.trim().toLowerCase() === CONJURO[1];

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEntrando(true);
    try {
      await entrarCentral(correo, password);
      // Al abrirse la sesión, App repinta en Central.
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-5 shadow-2xl w-full max-w-xs"
        onClick={(ev) => ev.stopPropagation()}
        style={{ animation: "slideUp 200ms ease-out" }}
      >
        <div className="flex flex-col items-center mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "#F1F1EE" }}
          >
            <ShieldCheck
              className="w-5 h-5"
              style={{ color: colors.navyMedium }}
              strokeWidth={1.6}
            />
          </div>
          <p
            className="font-semibold text-sm"
            style={{ color: colors.navyDark }}
          >
            Acceso de administrador
          </p>
          <p className="text-[11px] text-gray-500 text-center mt-1">
            Central guarda el padrón y los pagos.
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-3">
          <Input
            label="Correo"
            type="email"
            autoComplete="username"
            autoFocus
            value={correo}
            onChange={(ev) => setCorreo(ev.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />

          {error && (
            <p
              className="text-[11px] text-center"
              style={{ color: colors.danger }}
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              type="submit"
              disabled={entrando || !correo.trim() || !password}
            >
              {entrando ? "Entrando…" : "Entrar"}
            </Button>
          </div>
        </form>

        {conjurado && (
          <div
            className="flex justify-center items-end gap-4 pt-4 mt-3 border-t border-gray-100"
            style={{ animation: "slideUp 220ms ease-out" }}
          >
            {AUTORES.map((autor, N) => (
              <div className="flex flex-col items-center" key={autor.nombre}>
                <img
                  src={autor.sprite}
                  alt={autor.nombre}
                  className="h-16 w-auto"
                  style={{
                    imageRendering: "pixelated",
                    // Desfasados para que no paseen los tres a la vez.
                    animation: `vaiven 1.1s ease-in-out ${N * 0.22}s infinite alternate`,
                  }}
                />
                <p className="eyebrow mt-1" style={{ color: colors.muted }}>
                  {autor.nombre}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
