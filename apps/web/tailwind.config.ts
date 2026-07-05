import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // The two semantic accents: brand = "revealed", violet = "encrypted".
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        veil: {
          // "encrypted" semantic — used for the not-yet-decrypted state.
          violet: "#8b5cf6",
          indigo: "#6366f1",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        rain: {
          from: { transform: "translateY(-50%)" },
          to: { transform: "translateY(50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
