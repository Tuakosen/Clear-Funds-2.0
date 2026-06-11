/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB",
          50: "#EFF5FF",
          100: "#DCE8FF",
          200: "#BBD2FF",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        teal: { DEFAULT: "#40D6C9", accent: "#40D6C9" },
        income: "#22C55E",
        expense: "#EF4444",
        pro: "#8B5CF6",
        // Semantic tokens (mapped to CSS variables)
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        sidebar: "rgb(var(--sidebar) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        content: "rgb(var(--text-primary) / <alpha-value>)",
        "content-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "content-muted": "rgb(var(--text-muted) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "var(--card-shadow)",
        glow: "0 0 24px var(--glow-color)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
