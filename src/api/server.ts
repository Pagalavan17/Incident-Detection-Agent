/**
 * src/api/server.ts
 *
 * PURPOSE:
 *   Assembles and exports the Express application and a `startServer` function
 *   that binds it to the configured TCP port.
 *
 *   This file is the composition root of the HTTP layer:
 *     • Creates the Express app
 *     • Registers global middleware (JSON parsing, security headers)
 *     • Mounts all routers under their correct path prefixes
 *     • Registers the centralized error middleware (must be last)
 *     • Exports `startServer` for use by src/index.ts
 *
 * DESIGN DECISIONS:
 *   • app and startServer are exported separately so integration tests can
 *     import `app` directly without binding to a port (avoids EADDRINUSE).
 *   • No try/catch in startServer — unhandled listen errors (e.g. EADDRINUSE)
 *     propagate to the process and are caught by the unhandledRejection handler
 *     registered in src/index.ts.
 *   • requestId middleware — attaches a UUID to every request for log correlation.
 *   • Error middleware is the LAST app.use() call — Express identifies it by its
 *     4-argument signature and only invokes it when next(err) is called.
 *
 * DEPENDENCY RULE:
 *   Imports from express, config/env, and the api layer (controllers, routes,
 *   middleware) only. Never imports from domain services directly.
 */

import express from "express";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { createHealthRouter } from "./routes/health.routes";
import { createIncidentRouter } from "./routes/incident.routes";
import { healthController } from "./controllers/health.controller";
import { incidentController } from "./controllers/incident.controller";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Express Application Assembly
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────

/**
 * Parse incoming JSON bodies.
 * `limit` is set to 10mb to handle large log batch payloads.
 */
app.use(express.json({ limit: "10mb" }));

/**
 * Attach a unique request ID to each request for log correlation.
 * Available as req.headers["x-request-id"] downstream.
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  const existingId = req.headers["x-request-id"];
  if (!existingId || typeof existingId !== "string") {
    req.headers["x-request-id"] = randomUUID();
  }
  next();
});

/**
 * Basic security headers.
 * Prevents MIME-type sniffing, clickjacking, and cross-origin data leaks.
 */
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Routers ───────────────────────────────────────────────────────────────────

/**
 * Health routes: GET /health, GET /ready
 * Mounted at root level (not under /api/v1) for compatibility with standard
 * load-balancer and Kubernetes readiness probe paths.
 */
app.use("/", createHealthRouter(healthController));

/**
 * Incident routes: POST /api/v1/incident/analyze, POST /api/v1/root-cause, …
 */
app.use("/api/v1", createIncidentRouter(incidentController));

// ── 404 Handler ───────────────────────────────────────────────────────────────

/**
 * Catch-all for unrecognised routes.
 * Returns a structured 404 error that matches the error envelope shape.
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  next({
    code: "INCIDENT_NOT_FOUND",
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ── Centralized Error Middleware (must be last) ────────────────────────────────
app.use(errorMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Server Start Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts the Express HTTP server on the port defined in the environment.
 *
 * @returns — The running http.Server instance (allows graceful shutdown).
 */
export const startServer = (): ReturnType<typeof app.listen> => {
  const port = env.PORT;
  const server = app.listen(port, () => {
    const banner = [
      "",
      "  ╔══════════════════════════════════════════════════════════╗",
      "  ║   🚨  Incident Response & Post-Mortem Agent  ·  API     ║",
      "  ╠══════════════════════════════════════════════════════════╣",
      `  ║   Port    : ${String(port).padEnd(46)}║`,
      `  ║   Env     : ${env.NODE_ENV.padEnd(46)}║`,
      "  ╠══════════════════════════════════════════════════════════╣",
      "  ║   GET  /health                 Liveness probe           ║",
      "  ║   GET  /ready                  Readiness probe          ║",
      "  ║   POST /api/v1/incident/analyze  Full pipeline          ║",
      "  ║   POST /api/v1/root-cause        Debug: RCA only        ║",
      "  ║   POST /api/v1/remediation       Debug: Remediation     ║",
      "  ║   POST /api/v1/guardrails        Debug: Guardrails      ║",
      "  ║   POST /api/v1/postmortem        Debug: Post-Mortem     ║",
      "  ╚══════════════════════════════════════════════════════════╝",
      "",
    ].join("\n");

    console.log(banner);
  });

  // Graceful shutdown on SIGTERM (Kubernetes pod termination)
  process.on("SIGTERM", () => {
    console.log("[server] SIGTERM received — shutting down gracefully...");
    server.close(() => {
      console.log("[server] HTTP server closed.");
      process.exit(0);
    });
  });

  return server;
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. App Export
//
//   Exported for integration testing (import `app` without starting a server).
// ─────────────────────────────────────────────────────────────────────────────

export { app };
