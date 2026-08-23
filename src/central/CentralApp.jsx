import { useState } from "react";
import { ChartColumn, FileText, LogOut, ScanLine, Settings, Truck, Users } from "lucide-react";
import { FichaTrabajador } from "./FichaTrabajador.jsx";
import { FichaVehiculo } from "./FichaVehiculo.jsx";
import { ConfigTab } from "./tabs/ConfigTab.jsx";
import { EscanearTab } from "./tabs/EscanearTab.jsx";
import { RegistrosTab } from "./tabs/RegistrosTab.jsx";
import { ReporteDiarioTab } from "./tabs/ReporteDiarioTab.jsx";
import { ResumenTab } from "./tabs/ResumenTab.jsx";
import { VehiculosTab } from "./tabs/VehiculosTab.jsx";
import { useEstajos } from "../store/useEstajos.js";
import { colors } from "../theme.js";

export const CENTRAL_TABS = [
  {
    key: "escanear",
    label: "Escanear",
    icon: ScanLine,
  },
  {
    key: "reporte",
    label: "Reporte Diario",
    icon: FileText,
  },
  {
    key: "resumen",
    label: "Resumen",
    icon: ChartColumn,
  },
  {
    key: "registros",
    label: "Registros",
    icon: Users,
  },
  {
    key: "vehiculos",
    label: "Vehículos",
    icon: Truck,
  },
  {
    key: "config",
    label: "Configuración",
    icon: Settings,
  },
];

export function CentralHeader({ onSalir }) {
  return (
    <header
      className="px-4 sm:px-6 lg:px-8 pb-3 sticky top-0 z-30 bg-white"
      style={{
        paddingTop: "calc(0.9rem + env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="flex items-center justify-between max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <div>
          <h1
            className="font-semibold tracking-[0.22em] leading-none"
            style={{
              color: colors.navyDark,
              fontSize: 15,
            }}
          >
            ESTAJOS
          </h1>
          <p
            className="text-[11px] mt-1.5"
            style={{
              color: colors.muted,
            }}
          >
            Central
          </p>
        </div>
        <button
          onClick={onSalir}
          className="px-3 min-h-[36px] rounded-lg text-[13px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform"
          style={{
            color: colors.muted,
          }}
        >
          <LogOut className="w-[15px] h-[15px]" />
          {" Salir"}
        </button>
      </div>
    </header>
  );
}

export function CentralTabs({ tab, setTab }) {
  return (
    <nav
      className="bg-white border-b sticky z-20"
      style={{
        top: 0,
        borderColor: colors.line,
      }}
    >
      <div className="flex overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2.5 gap-1 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        {CENTRAL_TABS.map((n) => {
          const r = tab === n.key;
          return (
            <button
              onClick={() => setTab(n.key)}
              aria-current={r ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg text-[13px] whitespace-nowrap font-medium transition-colors flex-shrink-0"
              style={
                r
                  ? {
                      background: colors.primary,
                      color: "#fff",
                    }
                  : {
                      color: colors.muted,
                    }
              }
              key={n.key}
            >
              <n.icon className="w-[15px] h-[15px]" strokeWidth={1.8} /> {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function CentralShell({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: colors.appBg,
      }}
    >
      {children}
    </div>
  );
}

export function CentralApp({ onSalir }) {
  const { state, actions, cargando, error } = useEstajos();
  const [tab, setTab] = useState("escanear"),
    [fichaTrabajador, setFichaTrabajador] = useState(null),
    [fichaVehiculo, setFichaVehiculo] = useState(null);

  if (cargando) {
    return (
      <CentralShell>
        <CentralHeader onSalir={onSalir} />
        <p className="text-[13px] text-center pt-16" style={{ color: colors.muted }}>
          Cargando…
        </p>
      </CentralShell>
    );
  }

  return (
    <CentralShell>
      <CentralHeader onSalir={onSalir} />
      <CentralTabs
        tab={tab}
        setTab={(t) => {
          setTab(t);
          setFichaTrabajador(null);
          setFichaVehiculo(null);
        }}
      />

      {/* Los errores del servidor se enseñan enteros: vienen de las
          funciones de la base y están escritos para leerse. */}
      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-3 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
          <div
            className="rounded-xl px-3 py-2.5 flex items-start gap-2 border"
            style={{ background: "#FAF2F0", borderColor: "#E5C8C1" }}
          >
            <p className="text-[12px] flex-1" style={{ color: colors.danger }}>
              {error}
            </p>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={actions.recargar}
                className="text-[11px] font-medium"
                style={{ color: colors.primary }}
              >
                Reintentar
              </button>
              <button
                onClick={actions.limpiarError}
                className="text-[11px] font-medium"
                style={{ color: colors.muted }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {fichaTrabajador ? (
        <FichaTrabajador
          id={fichaTrabajador}
          state={state}
          actions={actions}
          onBack={() => setFichaTrabajador(null)}
        />
      ) : fichaVehiculo ? (
        <FichaVehiculo
          id={fichaVehiculo}
          state={state}
          actions={actions}
          onBack={() => setFichaVehiculo(null)}
        />
      ) : (
        <>
          {tab === "escanear" && <EscanearTab state={state} actions={actions} />}
          {tab === "reporte" && <ReporteDiarioTab state={state} actions={actions} />}
          {tab === "resumen" && <ResumenTab state={state} actions={actions} />}
          {tab === "registros" && (
            <RegistrosTab state={state} actions={actions} onVerFicha={setFichaTrabajador} />
          )}
          {tab === "vehiculos" && (
            <VehiculosTab state={state} actions={actions} onVerFicha={setFichaVehiculo} />
          )}
          {tab === "config" && <ConfigTab state={state} actions={actions} />}
        </>
      )}
    </CentralShell>
  );
}
