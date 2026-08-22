import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ok, supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

/**
 * Sesión de Supabase + perfil de negocio (organización y rol).
 *
 * El rol NO se lee del JWT: se consulta `perfiles`, que es lo mismo que
 * miran las políticas de RLS. Así la pantalla nunca enseña algo que la
 * base fuese a rechazar después.
 */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("perfiles")
      .select("user_id, org_id, rol, trabajador_id, activo, organizaciones(nombre)")
      .eq("user_id", userId)
      .maybeSingle();

    // Un usuario de auth sin perfil no es de esta aplicación: se le trata
    // como no autenticado en lugar de dejarlo en una pantalla vacía.
    if (error || !data || !data.activo) return null;
    return { ...data, org_nombre: data.organizaciones?.nombre ?? "" };
  }, []);

  useEffect(() => {
    let vivo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session ?? null;
      const p = s ? await cargarPerfil(s.user.id) : null;
      if (!vivo) return;
      setSesion(s);
      setPerfil(p);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, s) => {
      const p = s ? await cargarPerfil(s.user.id) : null;
      if (!vivo) return;
      setSesion(s ?? null);
      setPerfil(p);
      setCargando(false);
    });

    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  const entrarCentral = useCallback(
    async (correo, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password,
      });
      if (error) throw new Error("Correo o contraseña incorrectos.");

      const p = await cargarPerfil(data.user.id);
      if (!p) {
        await supabase.auth.signOut();
        throw new Error("Esta cuenta no tiene acceso.");
      }
      if (p.rol !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Esta cuenta no es de administración.");
      }
      return p;
    },
    [cargarPerfil],
  );

  /**
   * Campo entra con PIN. El PIN no viaja a la base desde el navegador: lo
   * canjea la Edge Function `campo-login` con la clave de servicio y
   * devuelve un token de un solo uso que aquí se convierte en sesión.
   */
  const entrarConPin = useCallback(
    async (pin) => {
      const { data, error } = await supabase.functions.invoke("campo-login", { body: { pin } });
      if (error) {
        // `invoke` esconde el cuerpo del error en `context`.
        let mensaje = "No se pudo entrar.";
        try {
          const cuerpo = await error.context?.json?.();
          if (cuerpo?.error) mensaje = cuerpo.error;
        } catch {
          /* nos quedamos con el mensaje genérico */
        }
        throw new Error(mensaje);
      }
      if (!data?.token || !data?.correo) throw new Error("PIN incorrecto");

      // GoTrue rechaza la petición si se manda `email` junto a `token_hash`
      // ("Only the token_hash and type should be provided"): supabase-js no
      // filtra los parámetros, los reenvía tal cual.
      ok(
        await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: "magiclink",
        }),
      );

      const { data: s } = await supabase.auth.getSession();
      const p = s.session ? await cargarPerfil(s.session.user.id) : null;
      if (!p) {
        await supabase.auth.signOut();
        throw new Error("Este PIN ya no tiene acceso.");
      }
      return p;
    },
    [cargarPerfil],
  );

  const salir = useCallback(async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setPerfil(null);
  }, []);

  return (
    <AuthContext.Provider value={{ sesion, perfil, cargando, entrarCentral, entrarConPin, salir }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
