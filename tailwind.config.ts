import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Vermelho reservado para emergência (botão de pânico / alerta ativo).
        sos: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        // Identidade institucional Prefeitura de Aracaju (anel turquesa→verde→dourado).
        aju: {
          50: "#ecfdff",
          100: "#cff7fc",
          200: "#a5eef7",
          300: "#67dfee",
          400: "#22c7dd",
          500: "#0aa9c2",
          600: "#0c87a0",
          700: "#116c81",
          800: "#175869",
          900: "#0b3a45",
          ink: "#0b3a45",
        },
        gold: {
          400: "#f6c945",
          500: "#f4b400",
          600: "#d99700",
        },
        grass: {
          500: "#3da935",
          600: "#2f8a2a",
        },
      },
      backgroundImage: {
        "aju-ring":
          "linear-gradient(135deg, #0aa9c2 0%, #3da935 55%, #f4b400 100%)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(220,38,38,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
