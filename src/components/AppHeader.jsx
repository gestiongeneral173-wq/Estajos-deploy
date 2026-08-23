import { ArrowLeft, LogOut } from "lucide-react";
import { colors } from "../theme.js";

export function AppHeader({
  title = "ESTAJOS",
  subtitle,
  onLogout,
  backTo,
  right,
}) {
  return (
    <header
      className="px-3 sm:px-6 lg:px-8 sticky top-0 z-30 bg-white border-b"
      style={{
        borderColor: colors.line,
        paddingTop: "calc(0.55rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "0.55rem",
      }}
    >
      <div className="flex items-center justify-between max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="flex items-center gap-1 min-w-0">
          {backTo && (
            <button
              onClick={backTo}
              aria-label="Volver"
              className="w-10 h-10 flex items-center justify-center rounded-lg -ml-1 active:scale-90 transition-transform"
              style={{
                color: colors.navyMedium,
              }}
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
          )}
          <div className={`min-w-0 ${backTo ? "" : "ml-2"}`}>
            <h1
              className="font-semibold text-[15px] tracking-tight truncate"
              style={{
                color: colors.navyDark,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-[11px] truncate"
                style={{
                  color: colors.muted,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {right}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg text-[13px] font-medium active:scale-95 transition-transform"
              style={{
                color: colors.muted,
              }}
            >
              <LogOut className="w-[15px] h-[15px]" />
              {" Salir"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
