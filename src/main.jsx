import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

// Sólo en producción: en desarrollo un service worker sirve versiones viejas
// del armazón y hace perder media tarde persiguiendo un cambio que sí estaba.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sin service worker la aplicación funciona igual, sólo que no offline */
    });
  });
}
