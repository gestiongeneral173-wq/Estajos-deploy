import { colors as tema } from "./src/theme.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Instrument Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      // Paleta "Pizarra": la fuente única es src/theme.js. Los tokens del tema se
      // exponen aquí como colores de Tailwind para poder escribir estados
      // (`hover:`, `focus:`) y variantes responsivas sobre ellos, cosa imposible
      // desde los `style={{}}` en línea.
      colors: {
        primary: tema.primary,
        navy: { DEFAULT: tema.navyDark, medium: tema.navyMedium },
        line: tema.line,
        muted: tema.muted,
        danger: tema.danger,
        appBg: tema.appBg,
        // La escala `gray` es la del tema, no la cálida de antes: Central se pinta
        // casi entera con `gray-*` y así hereda la paleta de Campo sin tocar 242
        // clases una por una.
        gray: {
          50: "#F7F9FA",
          100: tema.appBg,
          200: tema.line,
          300: "#C3CDD6",
          400: "#8A96A3",
          500: tema.muted,
          600: "#4A5563",
          700: tema.navyMedium,
          900: tema.navyDark,
        },
        green: {
          50: "#EFF4F1",
          100: "#DDE9E1",
          200: "#C1D5C8",
          300: "#9BBAA5",
          700: "#24593F",
        },
        red: {
          50: "#F9F1F1",
          200: "#E3C6C6",
          500: tema.danger,
        },
      },
      // Radios secos, unificados entre Campo y Central. Van aquí y no como
      // override en index.css para que las variantes (`sm:rounded-xl`) hereden
      // el mismo valor en vez de volver a los radios grandes de Tailwind.
      borderRadius: {
        lg: "0.3rem",
        xl: "0.4rem",
        "2xl": "0.5rem",
        "3xl": "0.5rem",
      },
      borderColor: {
        DEFAULT: tema.line,
      },
      boxShadow: {
        raised: "0 0 0 1px rgba(16,24,32,.08), 0 2px 6px rgba(16,24,32,.05)",
        sheet: "0 0 0 1px rgba(16,24,32,.1), 0 -4px 16px rgba(16,24,32,.08)",
      },
    },
  },
  plugins: [],
};
