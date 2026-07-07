/**
 * src/index.ts — Application Entry Point
 *
 * PURPOSE:
 *   Bootstraps the Incident Response Agent application.
 *   Starts the Express HTTP server (Module 11).
 *
 * EXECUTION:
 *   Development : npm run dev    (tsx watch — hot-reload)
 *   Production  : npm start      (node dist/index.js after npm run build)
 */

import "./config/env"; // validate env vars at startup (fail-fast)
import { startServer } from "./api/server";

// Catch any uncaught promise rejections and exit cleanly
process.on("unhandledRejection", (reason: unknown) => {
  console.error("[process] Unhandled rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("[process] Uncaught exception:", error);
  process.exit(1);
});

startServer();
