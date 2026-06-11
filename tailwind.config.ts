import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sos: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
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
