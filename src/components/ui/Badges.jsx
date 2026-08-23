import { colors } from "../../theme.js";

export const CODE_META = {
  E: {
    label: "Encargado",
    color: "#2F5C46",
    tipo: "rol",
  },
  C: {
    label: "Chofer",
    color: "#3D6B8C",
    tipo: "rol",
  },
  A: {
    label: "Ayudante",
    color: "#A6752B",
    tipo: "rol",
  },
  P: {
    label: "Pasajero",
    color: "#7C6A8C",
    tipo: "rol",
  },
  X: {
    label: "Sin asignar",
    color: "#9DA19C",
    tipo: "rol",
  },
  Q: {
    label: "Quincenal",
    color: "#C4883A",
    tipo: "pago",
  },
  M: {
    label: "Mensual",
    color: "#5B4E7A",
    tipo: "pago",
  },
};

export function CodeBadge({ code, size = 18 }) {
  const meta = CODE_META[code];
  if (!meta) {
    return null;
  }
  const esRol = meta.tipo === "rol";
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className="cifra"
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: esRol ? Math.round(size * 0.28) : 9999,
        background: esRol ? meta.color : "transparent",
        border: esRol ? "none" : `1px solid ${colors.line}`,
        color: esRol ? "#fff" : meta.color,
        fontSize: Math.round(size * 0.54),
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {code}
    </span>
  );
}

export function CodeBadges({ codes = [], size = 18, gap = 4 }) {
  return !codes || codes.length === 0 ? null : (
    <span
      className="inline-flex items-center flex-shrink-0"
      style={{
        gap,
      }}
    >
      {codes.map((cod) => (
        <CodeBadge code={cod} size={size} key={cod} />
      ))}
    </span>
  );
}
