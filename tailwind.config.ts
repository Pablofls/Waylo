import type { Config } from "tailwindcss";

// Tokens de diseño de Waylo. La escala `risk` es solo para mapa de calor y alertas;
// nunca se mezcla con `brand` para que el verde de marca no se lea como "zona segura".
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#072E28",
          700: "#0B5247",
          600: "#0F6B5C",
          500: "#13896F",
          100: "#E3F2EE",
        },
        ink: "#111418",
        muted: "#5B6470",
        line: "#E2E5E8",
        canvas: "#F6F7F7",
        risk: {
          yellow: "#F2C94C",
          orange: "#E8833A",
          red: "#D64545",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "Arial Narrow", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
    },
  },
  plugins: [],
};

export default config;
