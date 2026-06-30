import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f6",
          100: "#d6f0e8",
          200: "#aee2d2",
          300: "#7dceb5",
          400: "#48b394",
          500: "#2a9a7c",
          600: "#1f7d64",
          700: "#1b6451",
          800: "#185042",
          900: "#143f35",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
