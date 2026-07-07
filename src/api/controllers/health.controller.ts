/**
 * src/api/controllers/health.controller.ts
 *
 * PURPOSE:
 *   Handles the HTTP request/response cycle for liveness and readiness probes.
 *
 * ENDPOINTS:
 *   GET /health  — Liveness probe. Returns 200 if the process is running.
 *                  No external dependency checks.
 *
 *   GET /ready   — Readiness probe. Reports:
 *                  • Which AI providers have their keys configured (env check).
 *                  • Whether Qdrant is reachable (connectivity check).
 *                  Returns 200 when all configured providers are reachable,
 *                  503 when Qdrant is unreachable (the only storage dependency).
 *
 * DESIGN DECISIONS:
 *   • Never throws — all errors are caught and surfaced as "degraded" service
 *     entries so operators can diagnose quickly without crashing the probe.
 *   • Timeout-bounded checks — each connectivity probe has a 3-second timeout.
 *   • Provider status from env — AI provider availability is derived from
 *     env key presence (getProviderStatus()), not from live API calls.
 *     Making live auth calls on every readiness check would be expensive and
 *     would count against rate limits.
 *   • Qdrant connectivity IS probed — it is the only persistent storage layer
 *     and a live check is cheap (getCollections() is a lightweight list).
 *
 * DEPENDENCY RULE:
 *   Imports from config/env and services/qdrant only.
 *   Never imports from other controllers, routes, or pipeline.service.
 */

import type { Request, Response, NextFunction } from "express";
import { getProviderStatus } from "../../config/env";
import { qdrantClient } from "../../services/qdrant/qdrant-client";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Response Shapes
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceCheck {
  readonly name: string;
  readonly status: "ok" | "degraded" | "unconfigured";
  readonly latencyMs?: number;
  readonly message?: string;
}

interface LivenessBody {
  readonly status: "ok";
}

interface ReadinessBody {
  readonly status: "ok" | "degraded";
  readonly timestamp: string;
  readonly services: ReadonlyArray<ServiceCheck>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Connectivity Check Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 3_000;

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} check timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

/** Live connectivity check for Qdrant via the lightweight collections list call. */
const checkQdrantConnectivity = async (): Promise<ServiceCheck> => {
  const start = Date.now();
  try {
    await withTimeout(qdrantClient.getCollections(), PROBE_TIMEOUT_MS, "Qdrant");
    return { name: "qdrant", status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    return {
      name: "qdrant",
      status: "degraded",
      latencyMs: Date.now() - start,
      message: e instanceof Error ? e.message : String(e),
    };
  }
};

/**
 * Provider configuration check (no network call).
 * Returns "ok" if the key is present, "unconfigured" if absent.
 * AI providers are not connectivity-probed on every readiness call to avoid
 * consuming rate-limit quota.
 */
const checkProviderKey = (name: string, isConfigured: boolean): ServiceCheck =>
  isConfigured
    ? { name, status: "ok", message: "API key configured" }
    : { name, status: "unconfigured", message: `${name.toUpperCase().replace(/-/g, "_")}_API_KEY not set — this feature is unavailable` };

// ─────────────────────────────────────────────────────────────────────────────
// § 3. HealthController
// ─────────────────────────────────────────────────────────────────────────────

export class HealthController {
  /**
   * GET /health — Liveness probe.
   *
   * Returns 200 immediately if the process is alive.
   * No external dependencies are checked here.
   */
  liveness(_req: Request, res: Response, _next: NextFunction): void {
    const body: LivenessBody = { status: "ok" };
    res.status(200).json(body);
  }

  /**
   * GET /ready — Readiness probe.
   *
   * Checks:
   *   • Qdrant connectivity (live network probe)
   *   • Anthropic, OpenAI, Enkrypt key presence (env check, no network call)
   *
   * HTTP 200 — Qdrant is reachable (server can accept and process requests).
   *             AI providers may be "unconfigured" — that is not a readiness failure
   *             because the pipeline degrades gracefully when keys are absent.
   * HTTP 503 — Qdrant is unreachable (log ingestion and retrieval will fail).
   */
  async readiness(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const providerStatus = getProviderStatus();

      // Run Qdrant connectivity probe (the only check that uses the network).
      const qdrantCheck = await checkQdrantConnectivity();

      const services: ReadonlyArray<ServiceCheck> = [
        qdrantCheck,
        checkProviderKey("anthropic", providerStatus.anthropic),
        checkProviderKey("openai", providerStatus.openai),
        checkProviderKey("enkrypt", providerStatus.enkrypt),
      ];

      // The server is "ready" as long as Qdrant is reachable.
      // Unconfigured AI providers degrade specific pipeline steps — they do NOT
      // make the server unready (it can still accept and partially process requests).
      const isReady = qdrantCheck.status === "ok";

      const body: ReadinessBody = {
        status: isReady ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services,
      };

      res.status(isReady ? 200 : 503).json(body);
    } catch (e) {
      next(e);
    }
  }
}

/** Pre-configured singleton. */
export const healthController = new HealthController();
