export const colors = {
  navyDark: "#101820",
  navyMedium: "#2B3A4A",
  primary: "#24597F",
  gold: "#6B7684",
  appBg: "#EEF1F4",
  danger: "#A23B3B",
  line: "#D7DEE5",
  muted: "#66707C",
  chatBg: "#EEF1F4",
};

export function hexToRgba(hex, alpha) {
  const limpio = hex.replace("#", ""),
    int = parseInt(limpio, 16),
    r = (int >> 16) & 255,
    g = (int >> 8) & 255,
    b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
