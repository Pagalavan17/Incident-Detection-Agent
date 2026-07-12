import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/health": {
        target: "http://0.0.0.0:3000",
        changeOrigin: true,
      },
      "/ready": {
        target: "http://0.0.0.0:3000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://0.0.0.0:3000",
        changeOrigin: true,
      },
    },
  },
});
