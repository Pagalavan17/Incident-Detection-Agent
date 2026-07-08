/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: {
            dark: "#0b0f19",
            light: "#f8fafc",
          },
          panel: {
            dark: "#111827",
            light: "#ffffff",
          },
          border: {
            dark: "#1f2937",
            light: "#e2e8f0",
          },
          primary: {
            DEFAULT: "#3b82f6",
            dark: "#60a5fa",
            light: "#2563eb",
          },
          accent: "#06b6d4", // Cyan
          success: "#10b981", // Emerald
          warning: "#f59e0b", // Amber
          danger: "#ef4444", // Red
          muted: {
            dark: "#9ca3af",
            light: "#64748b",
          }
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
