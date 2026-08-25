import { useEffect, useState } from "react";
import { colors } from "../theme.js";

// Se recuerda para siempre, no por sesión: una vez que alguien lo cierra o
// instala, no tiene sentido volver a pedírselo cada vez que abre la app.
const CLAVE_VISTO = "estajos-instalar-visto";

// Ningún Safari —ni de iPhone/iPad ni el de escritorio en Mac— dispara
// `beforeinstallprompt`; es el único caso sin evento, así que es el único
// que necesita instrucciones manuales en vez de un botón.
//
// Los iPads con iPadOS 13+ se anuncian con user-agent de Mac de escritorio,
// no de iPad — por eso el chequeo de touch además del user-agent clásico.
const esSafariSinEvento = () => {
  const ua = navigator.userAgent;
  if (/Chrome|Chromium|Edg|OPR|Android/i.test(ua)) return false;
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    /Safari/i.test(ua)
  );
};

const yaInstalada = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

/**
 * Aviso para instalar la app — funciona igual desde celular, tablet o
 * laptop/computadora, cada uno instala su propio acceso directo. Safari
 * (móvil o de escritorio) y el resto de navegadores no tienen nada en común
 * aquí:
 *
 * - Chrome/Edge (celular, tablet o escritorio) disparan `beforeinstallprompt`;
 *   se captura ese evento (si no, el navegador podría mostrar su propio
 *   aviso) y se dispara a mano con el botón "Instalar".
 * - Safari no tiene ese evento — nunca lo va a ofrecer solo. Lo único que se
 *   puede hacer es explicar los pasos manuales.
 */
export function InstalarAppBanner() {
  const [promptDiferido, setPromptDiferido] = useState(null);
  const [safari, setSafari] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (yaInstalada() || localStorage.getItem(CLAVE_VISTO)) return;

    if (esSafariSinEvento()) {
      setSafari(true);
      setVisible(true);
      return;
    }

    const alCapturar = (evento) => {
      evento.preventDefault();
      setPromptDiferido(evento);
      setVisible(true);
    };
    const alInstalar = () => {
      localStorage.setItem(CLAVE_VISTO, "1");
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", alCapturar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alCapturar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  const cerrar = () => {
    localStorage.setItem(CLAVE_VISTO, "1");
    setVisible(false);
  };

  const instalar = async () => {
    if (!promptDiferido) return;
    promptDiferido.prompt();
    await promptDiferido.userChoice;
    localStorage.setItem(CLAVE_VISTO, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] flex items-center gap-3 px-4 py-3"
      style={{
        background: colors.navyDark,
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-medium">Instala ESTAJOS</p>
        <p className="text-[11px]" style={{ color: "#9AA5B1" }}>
          {safari
            ? 'Toca el ícono de compartir y elige "Añadir a pantalla de inicio" (o "Agregar al Dock" en Mac).'
            : "Ábrela más rápido, como una app, sin pasar por el navegador."}
        </p>
      </div>
      {!safari && (
        <button
          onClick={instalar}
          className="shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-semibold"
          style={{ background: colors.primary, color: "#fff" }}
        >
          Instalar
        </button>
      )}
      <button
        onClick={cerrar}
        aria-label="Cerrar aviso de instalación"
        className="shrink-0 text-[22px] leading-none"
        style={{ color: "#9AA5B1" }}
      >
        ×
      </button>
    </div>
  );
}
