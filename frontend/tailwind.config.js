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
        brand: {
          primary: "#4F46E5",   // Indigo
          secondary: "#6366F1", // Light Indigo
          accent: "#3B82F6",    // Bright Blue
          neon: "#00D9FF",      // Cyan Neon
          purple: "#8B5CF6",    // Purple
        },
        cyber: {
          bg: {
            dark: "#070B14",
            light: "#f8fafc",
          },
          panel: {
            dark: "#111827",
            light: "#ffffff",
          },
          border: {
            dark: "rgba(255,255,255,0.08)",
            light: "#e2e8f0",
          },
          primary: {
            DEFAULT: "#4F46E5",
            dark: "#6366F1",
            light: "#4F46E5",
          },
          accent: "#3B82F6",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          muted: {
            dark: "#9ca3af",
            light: "#64748b",
          }
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#D1D5DB",
          muted: "#9CA3AF",
          dim: "#6B7280",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "Monaco", "Courier New", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(79, 70, 229, 0.25)",
        glowCyan: "0 0 24px rgba(0, 217, 255, 0.2)",
      }
    },
  },
  plugins: [],
}
