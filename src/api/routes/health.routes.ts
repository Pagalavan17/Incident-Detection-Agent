/**
 * src/api/routes/health.routes.ts
 *
 * PURPOSE:
 *   Defines the Express router for liveness (/health) and readiness (/ready)
 *   probe endpoints. These are infrastructure-level endpoints used by load
 *   balancers, orchestrators (k8s), and monitoring tools.
 *
 * DESIGN DECISIONS:
 *   • Routes only — no business logic. All checks are delegated to the
 *     HealthController.
 *   • /health is a liveness probe: returns 200 immediately if the process is
 *     running. Used to restart unhealthy pods.
 *   • /ready is a readiness probe: verifies that all upstream dependencies
 *     (Qdrant, Anthropic, OpenAI, Enkrypt) are reachable before accepting
 *     traffic.
 *
 * DEPENDENCY RULE:
 *   Imports from express and the health controller only.
 */

import { Router } from "express";
import type { HealthController } from "../controllers/health.controller";

/**
 * Factory that creates the health router with the given controller.
 *
 * @param controller — Injected HealthController instance.
 * @returns          — Configured Express Router.
 */
export const createHealthRouter = (controller: HealthController): Router => {
  const router = Router();

  /**
   * GET /health
   *
   * Liveness probe. Returns 200 { status: "ok" } as long as the process is up.
   * Does NOT check external dependencies — that is /ready's job.
   */
  router.get("/health", (req, res, next) => {
    controller.liveness(req, res, next);
  });

  /**
   * GET /ready
   *
   * Readiness probe. Checks all external service connections.
   * Returns 200 when all services are reachable, 503 when any is down.
   */
  router.get("/ready", (req, res, next) => {
    controller.readiness(req, res, next);
  });

  return router;
};
