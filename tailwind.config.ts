import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          300: "#C4B5FD",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        success: { DEFAULT: "#10B981", 50: "#ECFDF5", 100: "#D1FAE5", 600: "#059669", 700: "#047857" },
        warning: { DEFAULT: "#F59E0B", 50: "#FFFBEB", 100: "#FEF3C7", 600: "#D97706", 700: "#B45309" },
        danger: { DEFAULT: "#EF4444", 50: "#FEF2F2", 100: "#FEE2E2", 600: "#DC2626", 700: "#B91C1C" },
        info: { DEFAULT: "#06B6D4", 50: "#ECFEFF", 100: "#CFFAFE", 600: "#0891B2", 700: "#0E7490" },
        surface: "#F8FAFC",
        ink: "#0F172A",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 32px -8px rgba(99, 102, 241, 0.25)",
        glow: "0 0 0 1px rgba(99,102,241,.15), 0 8px 32px -8px rgba(139,92,246,.35)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pop-bounce": {
          "0%": { transform: "scale(.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up .5s ease both",
        "fade-in": "fade-in .4s ease both",
        float: "float 6s ease-in-out infinite",
        "scale-in": "scale-in .18s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "pop-bounce": "pop-bounce .45s cubic-bezier(.34,1.56,.64,1) both",
        marquee: "marquee 30s linear infinite",
        "slide-in": "slide-in .25s ease-out both",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
