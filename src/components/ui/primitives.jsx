import { useState } from "react";
import { ChevronDown, ChevronUp, CircleUser, X } from "lucide-react";
import { colors, hexToRgba } from "../../theme.js";

export function Num({ children, tone = "default", className = "" }) {
  const color =
    tone === "muted"
      ? colors.muted
      : tone === "strong"
        ? colors.navyDark
        : colors.navyMedium;
  return (
    <span
      className={`cifra text-[13px] ${className}`}
      style={{
        color,
      }}
    >
      {children}
    </span>
  );
}

/** El "+2" de lo que añadió Central, pegado a la cifra que fichó campo. */
export function Anadido({ valor }) {
  if (!Number(valor)) return null;
  return (
    <span style={{ color: colors.primary }} title="Añadido desde Central">
      +{Number(valor)}
    </span>
  );
}

export function StatusDot({ tone = "ok", className = "" }) {
  const color =
    tone === "ok"
      ? colors.primary
      : tone === "pendiente"
        ? "#9DA19C"
        : colors.danger;
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${className}`}
      style={{
        background: color,
      }}
    />
  );
}

export function AvatarIcon({
  size = 28,
  tone = "navy",
  icon: Icon = CircleUser,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F1F1EE",
      }}
    >
      <Icon
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: tone === "gray" ? "#9DA19C" : colors.navyMedium,
        }}
        strokeWidth={1.6}
      />
    </div>
  );
}

export function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border transition-shadow ${onClick ? "card-interactiva cursor-pointer" : ""} ${className}`}
      style={{
        borderColor: colors.line,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ color = "gold", children, className = "" }) {
  return (
    <h2
      className={`eyebrow mb-4 ${className}`}
      style={{
        color: colors.muted,
      }}
    >
      {children}
    </h2>
  );
}

export function Button({
  variant = "primary",
  icon = null,
  active = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  children,
}) {
  if (variant === "pill") {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`px-3.5 min-h-[36px] rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors active:scale-95 disabled:opacity-40 ${className}`}
        style={
          active
            ? {
                background: colors.navyDark,
                color: "#fff",
              }
            : {
                background: "transparent",
                color: colors.muted,
                border: `1px solid ${colors.line}`,
              }
        }
      >
        {children}
      </button>
    );
  }
  const variantes = {
      primary: {
        background: colors.primary,
        color: "#fff",
      },
      dark: {
        background: colors.navyDark,
        color: "#fff",
      },
      outline: {
        background: "#fff",
        color: colors.navyDark,
        border: `1px solid ${colors.line}`,
      },
      gold: {
        background: colors.navyDark,
        color: "#fff",
      },
      danger: {
        background: "#fff",
        color: colors.danger,
        border: `1px solid ${hexToRgba(colors.danger, 0.3)}`,
      },
    },
    estilo = variantes[variant] || variantes.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full min-h-[48px] px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed ${className}`}
      style={estilo}
    >
      {icon}
      {children}
    </button>
  );
}

export function Input({ label, hint, className = "", style = {}, ...rest }) {
  return (
    <div>
      {label && (
        <label
          className="eyebrow block mb-2"
          style={{
            color: colors.muted,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...rest}
        className={`w-full min-h-[46px] px-3.5 bg-white border rounded-lg text-sm outline-none focus:border-primary transition-colors placeholder:text-gray-400 ${className}`}
        style={{
          color: colors.navyDark,
          borderColor: colors.line,
          ...style,
        }}
      />
      {hint && <p className="text-[11px] text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

export function Sheet({ open, title, onClose, children, maxW = "max-w-md" }) {
  return open ? (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4"
      style={{
        background: "rgba(25,27,26,0.35)",
      }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-xl px-5 pb-6 pt-3 sm:pt-5 shadow-sheet w-full ${maxW} max-h-[88vh] overflow-y-auto`}
        onClick={(s) => s.stopPropagation()}
        style={{
          animation: "slideUp 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className="w-8 h-1 rounded-full mx-auto mb-4 sm:hidden"
          style={{
            background: colors.line,
          }}
        />
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-[15px] font-semibold"
            style={{
              color: colors.navyDark,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 -mr-2 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 active:scale-90 transition-all"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;
}

export function IconBubble({ icon: Icon, size = "md", shape = "circle" }) {
  const px = {
    sm: 30,
    md: 38,
    lg: 46,
    xl: 72,
  }[size];
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: px,
        height: px,
        background: "#F1F1EE",
        borderRadius: shape === "square" ? Math.round(px * 0.26) : 9999,
      }}
    >
      <Icon
        style={{
          width: px * 0.44,
          height: px * 0.44,
          color: colors.navyMedium,
        }}
        strokeWidth={1.6}
      />
    </div>
  );
}

export function StatCard({ value, label, color = "navy" }) {
  const colores = {
    navy: colors.navyDark,
    primary: colors.primary,
    danger: colors.danger,
    gold: colors.navyDark,
  };
  return (
    <div
      className="bg-white rounded-xl p-4 border"
      style={{
        borderColor: colors.line,
      }}
    >
      <p
        className="cifra text-[22px] font-medium leading-none"
        style={{
          color: colores[color],
        }}
      >
        {value}
      </p>
      <p
        className="eyebrow mt-2.5"
        style={{
          color: colors.muted,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function Accordion({
  title,
  color = "green",
  children,
  defaultOpen = false,
}) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <Card>
      <button
        onClick={() => setAbierto((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <SectionTitle color={color} className="mb-0">
          {title}
        </SectionTitle>
        {abierto ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {abierto && <div className="mt-4">{children}</div>}
    </Card>
  );
}
