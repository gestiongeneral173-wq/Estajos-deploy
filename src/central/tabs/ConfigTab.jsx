import { useState } from "react";
import { Check, KeyRound, ShieldAlert } from "lucide-react";
import { Button, Card, Input, SectionTitle } from "../../components/ui/primitives.jsx";
import { marcarCorte } from "../../lib/panico.js";
import { colors, hexToRgba } from "../../theme.js";

// La contraseña la guarda Supabase Auth, no la base de negocio: aquí no
// hay nada que hashear ni que comparar.
export function ConfigTab({ actions }) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    if (pass.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (pass !== pass2) return setError("Las contraseñas no coinciden.");

    setGuardando(true);
    try {
      await actions.cambiarPassword(pass);
      setPass("");
      setPass2("");
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto space-y-4 lg:space-y-5">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: hexToRgba(colors.navyDark, 0.06),
            }}
          >
            <KeyRound
              className="w-4 h-4"
              style={{
                color: colors.navyDark,
              }}
            />
          </div>
          <SectionTitle color="green" className="mb-0">
            Cambiar contraseña
          </SectionTitle>
        </div>
        {error && (
          <div className="p-3 mb-3 border border-red-200 bg-red-50 rounded-xl">
            <p
              className="text-xs font-medium text-center"
              style={{
                color: colors.danger,
              }}
            >
              {error}
            </p>
          </div>
        )}
        {ok && (
          <div className="flex items-center justify-center gap-2 p-3 mb-3 border border-green-200 bg-green-50 rounded-xl">
            <Check
              className="w-4 h-4"
              style={{
                color: colors.primary,
              }}
            />
            <p
              className="text-xs font-semibold"
              style={{
                color: colors.primary,
              }}
            >
              Contraseña actualizada
            </p>
          </div>
        )}
        <form onSubmit={guardar} className="space-y-3">
          <Input
            label="Nueva contraseña"
            type="password"
            value={pass}
            onChange={(h) => setPass(h.target.value)}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={pass2}
            onChange={(h) => setPass2(h.target.value)}
          />
          <Button variant="dark" type="submit">
            Guardar contraseña
          </Button>
        </form>
      </Card>

      <PanicoCard actions={actions} />
    </div>
  );
}

/**
 * Corte de emergencia.
 *
 * No es un interruptor de pantalla: `activar_panico()` le retira los permisos a
 * `anon` y `authenticated` dentro de Postgres, así que deja de haber datos que
 * leer para cualquiera que tenga la aplicación abierta o la clave pública. Por
 * eso mismo NO hay botón para deshacerlo — hace falta entrar al SQL Editor de
 * Supabase y ejecutar `BACKEND/scripts/restablecer-acceso.sql`.
 */
function PanicoCard({ actions }) {
  const [fase, setFase] = useState("idle"); // idle · confirmar · cambiar
  const [password, setPassword] = useState("");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const activar = async (e) => {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      await actions.activarPanico(password);
      // La base ya está cerrada: no hay nada que recargar ni sesión que cerrar
      // contra ella. Se marca el corte y se recarga para dejar sólo el logo.
      marcarCorte();
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setOcupado(false);
    }
  };

  const cambiar = async (e) => {
    e.preventDefault();
    setError(null);
    if (nueva.length < 8) return setError("La nueva contraseña necesita al menos 8 caracteres.");
    setOcupado(true);
    try {
      await actions.cambiarPasswordPanico(actual, nueva);
      setActual("");
      setNueva("");
      setFase("idle");
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: hexToRgba(colors.danger, 0.08) }}
        >
          <ShieldAlert className="w-4 h-4" style={{ color: colors.danger }} />
        </div>
        <SectionTitle color="green" className="mb-0">
          Corte de emergencia
        </SectionTitle>
      </div>

      <p className="text-[12px] mb-3" style={{ color: colors.muted }}>
        Desconecta la aplicación de la base de datos al instante, para todo el mundo. Úsalo si crees
        que alguien está accediendo a los datos sin permiso.{" "}
        <strong style={{ color: colors.danger }}>No se puede deshacer desde aquí</strong>: para
        volver a abrir hay que ejecutar los permisos a mano en Supabase.
      </p>

      {error && (
        <div className="p-3 mb-3 border border-red-200 bg-red-50 rounded-xl">
          <p className="text-xs font-medium text-center" style={{ color: colors.danger }}>
            {error}
          </p>
        </div>
      )}
      {ok && (
        <div className="flex items-center justify-center gap-2 p-3 mb-3 border border-green-200 bg-green-50 rounded-xl">
          <Check className="w-4 h-4" style={{ color: colors.primary }} />
          <p className="text-xs font-semibold" style={{ color: colors.primary }}>
            Contraseña de emergencia actualizada
          </p>
        </div>
      )}

      {fase === "idle" && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setFase("cambiar")}>
            Cambiar contraseña
          </Button>
          <Button variant="danger" onClick={() => setFase("confirmar")}>
            Cortar acceso
          </Button>
        </div>
      )}

      {fase === "confirmar" && (
        <form onSubmit={activar} className="space-y-3">
          <Input
            label="Contraseña de emergencia"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(h) => setPassword(h.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setFase("idle");
                setPassword("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="danger" type="submit" disabled={!password || ocupado}>
              {ocupado ? "Cortando…" : "Cortar ahora"}
            </Button>
          </div>
        </form>
      )}

      {fase === "cambiar" && (
        <form onSubmit={cambiar} className="space-y-3">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="off"
            value={actual}
            onChange={(h) => setActual(h.target.value)}
          />
          <Input
            label="Nueva contraseña (mínimo 8)"
            type="password"
            autoComplete="off"
            value={nueva}
            onChange={(h) => setNueva(h.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setFase("idle");
                setActual("");
                setNueva("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="dark" type="submit" disabled={ocupado}>
              Guardar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
