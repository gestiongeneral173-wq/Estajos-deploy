import { useEffect, useState } from "react";

import { LoginCentral } from "./auth/LoginCentral.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";
import { CampoInicio } from "./campo/CampoInicio.jsx";
import { NuevoRegistroWizard } from "./campo/NuevoRegistroWizard.jsx";
import { PinLogin } from "./campo/PinLogin.jsx";
import { useCampo } from "./campo/useCampo.js";
import { CentralApp } from "./central/CentralApp.jsx";
import { AppHeader } from "./components/AppHeader.jsx";
import { alCortar, hayCorte } from "./lib/panico.js";
import { comprobarCorte } from "./lib/supabase.js";
import { colors } from "./theme.js";

function Pantalla({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: colors.appBg }}
    >
      {children}
    </div>
  );
}

/**
 * Lo único que queda en pie tras el corte de emergencia.
 *
 * Sin texto de ayuda a propósito: si alguien ha llegado hasta aquí sin permiso,
 * no se le explica qué ha pasado ni cómo se vuelve.
 */
function PantallaCortada() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: colors.appBg }}
    >
      <h1
        className="text-[28px] font-semibold tracking-[0.3em] select-none"
        style={{ color: colors.navyDark }}
      >
        ESTAJOS
      </h1>
    </div>
  );
}

/**
 * Quién ve qué lo decide el perfil, que es lo mismo que miran las políticas
 * de RLS. Si la base fuese a rechazar algo, la pantalla no lo ofrece.
 */
export function App() {
  const { perfil, cargando, salir } = useAuth();
  const [modalCentral, setModalCentral] = useState(false);
  const [cortado, setCortado] = useState(hayCorte);

  // La sonda decide, y decide en los dos sentidos: si los permisos se han
  // restablecido, la aplicación vuelve sola al recargar sin tener que vaciar
  // nada. Cualquier consulta que huela a corte la vuelve a lanzar.
  useEffect(() => {
    const quitar = alCortar(() => setCortado(hayCorte()));
    comprobarCorte().catch(() => {});
    return quitar;
  }, []);

  if (cortado) return <PantallaCortada />;

  if (cargando) {
    return (
      <Pantalla>
        <p className="text-[13px]" style={{ color: colors.muted }}>
          Cargando…
        </p>
      </Pantalla>
    );
  }

  if (!perfil) {
    return (
      <>
        <PinLogin onOpenCentral={() => setModalCentral(true)} />
        {modalCentral && <LoginCentral onCancel={() => setModalCentral(false)} />}
      </>
    );
  }

  if (perfil.rol === "admin") return <CentralApp onSalir={salir} />;
  if (perfil.rol === "encargado") return <AppCampo onSalir={salir} perfil={perfil} />;

  return (
    <Pantalla>
      <p className="text-sm font-medium" style={{ color: colors.navyDark }}>
        Esta cuenta no tiene acceso.
      </p>
      <button className="text-[13px] mt-3" style={{ color: colors.primary }} onClick={salir}>
        Salir
      </button>
    </Pantalla>
  );
}

function AppCampo({ onSalir, perfil }) {
  const { vehiculos, personas, registros, cargando, error, enviarParte } = useCampo();
  const [wizardAbierto, setWizardAbierto] = useState(false);

  if (cargando) {
    return (
      <Pantalla>
        <p className="text-[13px]" style={{ color: colors.muted }}>
          Cargando…
        </p>
      </Pantalla>
    );
  }

  if (error) {
    return (
      <Pantalla>
        <p className="text-sm font-medium" style={{ color: colors.danger }}>
          {error}
        </p>
        <button className="text-[13px] mt-3" style={{ color: colors.primary }} onClick={onSalir}>
          Salir
        </button>
      </Pantalla>
    );
  }

  const finalizarParte = async (fecha, vehiculoId, parte) => {
    await enviarParte(fecha, vehiculoId, parte);
  };

  return (
    <div className="relative min-h-screen">
      <div
        style={{
          filter: wizardAbierto ? "grayscale(1) opacity(0.4)" : "none",
          transition: "filter 260ms ease",
          pointerEvents: wizardAbierto ? "none" : "auto",
        }}
      >
        <CampoInicio
          registrosCampo={registros}
          vehiculos={vehiculos}
          personas={personas}
          onLogout={onSalir}
          onAbrirRegistro={() => setWizardAbierto(true)}
        />
      </div>

      {wizardAbierto && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "transparent" }}>
          <div
            className="flex-1 flex flex-col mt-10 sm:mt-16 rounded-t-3xl overflow-hidden shadow-2xl mx-auto w-full sm:max-w-xl"
            style={{
              background: "transparent",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
            }}
          >
            <AppHeader title="Nuevo registro" backTo={() => setWizardAbierto(false)} />
            <NuevoRegistroWizard
              registrosCampo={registros}
              vehiculos={vehiculos}
              personas={personas}
              encargadoId={perfil.trabajador_id}
              onFinalizar={finalizarParte}
              onCancel={() => setWizardAbierto(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
