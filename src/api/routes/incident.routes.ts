/**
 * src/api/routes/incident.routes.ts
 *
 * PURPOSE:
 *   Defines the Express router for all incident-related endpoints.
 *   Routes only — no business logic, no service instantiation.
 *
 * ENDPOINTS:
 *   POST /api/v1/incident/analyze      — full pipeline run
 *   POST /api/v1/root-cause            — debug: root cause only
 *   POST /api/v1/remediation           — debug: remediation only
 *   POST /api/v1/guardrails            — debug: guardrails only
 *   POST /api/v1/postmortem            — debug: post-mortem only
 *
 * DESIGN DECISIONS:
 *   • Factory pattern — the router is created by a factory function so the
 *     controller can be injected (no module-level singleton instantiation).
 *   • Routes are thin — each route handler is a one-liner that delegates to
 *     the controller. No logic lives here.
 *
 * DEPENDENCY RULE:
 *   Imports from express and the incident controller only.
 */

import { Router } from "express";
import type { IncidentController } from "../controllers/incident.controller";

/**
 * Factory that creates the incident router with the given controller.
 *
 * @param controller — Injected IncidentController instance.
 * @returns          — Configured Express Router.
 */
export const createIncidentRouter = (controller: IncidentController): Router => {
  const router = Router();

  // ── Primary Endpoint ────────────────────────────────────────────────────────

  /**
   * POST /api/v1/incident/analyze
   *
   * Runs the complete incident response pipeline:
   *   Parse → Validate → Normalize → Detect → Retrieve → RCA → Remediation
   *   → Guardrails → Post-Mortem
   *
   * Body: { logs: RawLogEntry[] }
   */
  router.post("/incident/analyze", (req, res, next) => {
    controller.analyze(req, res, next);
  });

  // ── Debug / Development Endpoints ───────────────────────────────────────────

  /**
   * POST /api/v1/root-cause
   *
   * Debug endpoint: runs only the root cause analysis step.
   * Body: { context: IncidentContext, retrievalResult: RetrievalResult }
   */
  router.post("/root-cause", (req, res, next) => {
    controller.rootCause(req, res, next);
  });

  /**
   * POST /api/v1/remediation
   *
   * Debug endpoint: runs only the remediation recommendation step.
   * Body: { context: IncidentContext, rootCause: RootCauseAnalysis }
   */
  router.post("/remediation", (req, res, next) => {
    controller.remediation(req, res, next);
  });

  /**
   * POST /api/v1/guardrails
   *
   * Debug endpoint: runs only the guardrails validation step.
   * Body: { context: IncidentContext, rootCause: RootCauseAnalysis, remediation: RemediationPlan }
   */
  router.post("/guardrails", (req, res, next) => {
    controller.guardrails(req, res, next);
  });

  /**
   * POST /api/v1/postmortem
   *
   * Debug endpoint: runs only the post-mortem generation step.
   * Body: { context: IncidentContext, rootCause: RootCauseAnalysis,
   *         remediation: RemediationPlan, validation: ValidationResult }
   */
  router.post("/postmortem", (req, res, next) => {
    controller.postMortem(req, res, next);
  });

  return router;
};
