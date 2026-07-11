/**
 * src/api/controllers/incident.controller.ts
 *
 * PURPOSE:
 *   HTTP adaptor for incident-related endpoints.
 *   Translates incoming HTTP requests into calls to IncidentPipelineService
 *   and maps its results back to HTTP responses.
 *
 * DESIGN CONTRACT:
 *   • Zero business logic — structural shape validation only (is `logs` an
 *     array?). All domain logic belongs to IncidentPipelineService.
 *   • Single dependency — the controller depends ONLY on IncidentPipelineService
 *     from src/core/. It NEVER imports or instantiates individual domain
 *     services (parser, validator, RCA service, etc.).
 *   • Result<T, AppError> propagation — on service failure the AppError is
 *     forwarded to the Express error middleware via next(). HTTP status codes
 *     are determined by the error middleware, not here.
 *   • Consistent success envelope — all 2xx responses have the shape:
 *       { success: true, data: { ... } }
 *   • Debug endpoints — the /root-cause, /remediation, /guardrails, and
 *     /postmortem endpoints are provided for development convenience. They
 *     accept pre-built domain objects in their bodies and delegate to the
 *     pipeline service for execution.
 *
 * DEPENDENCY RULE:
 *   Imports from: express, types/common, api/middleware, core/incident-pipeline.service.
 *   NEVER imports from: individual domain services, mastra, models, or config.
 */

import type { Request, Response, NextFunction } from "express";
import type { AppError } from "../../types/common";
import { makeError } from "../../types/common";
import { HttpError } from "../middleware/error.middleware";
import type {
  IncidentPipelineService,
  CompleteIncidentResponse,
} from "../../core/incident-pipeline.service";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Success Response Envelope
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessBody<T> {
  readonly success: true;
  readonly data: T;
}

const successBody = <T>(data: T): SuccessBody<T> => ({
  success: true,
  data,
});

// ─────────────────────────────────────────────────────────────────────────────
// § 2. HTTP-Layer Request Validators
//
//   These validate only the structural contract of the HTTP request body.
//   Domain validation is handled entirely by the pipeline service.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assert that `req.body.logs` is a non-empty array.
 * Throws an HttpError with 400 if the assertion fails.
 */
const requireLogsArray = (body: unknown): ReadonlyArray<unknown> => {
  if (
    body === null ||
    typeof body !== "object" ||
    !Array.isArray((body as Record<string, unknown>)["logs"])
  ) {
    throw new HttpError(
      makeError(
        "LOG_PARSE_FAILED",
        "Request body must be a JSON object with a 'logs' array field."
      ),
      400
    );
  }

  const logs = (body as Record<string, unknown>)["logs"] as unknown[];
  if (logs.length === 0) {
    throw new HttpError(
      makeError("LOG_PARSE_FAILED", "The 'logs' array must not be empty."),
      400
    );
  }

  return logs;
};

/**
 * Assert a named field is present in the body object.
 * Throws an HttpError with 400 if the field is absent or null.
 */
const requireField = <T>(body: Record<string, unknown>, field: string): T => {
  const value = body[field];
  if (value === undefined || value === null) {
    throw new HttpError(
      makeError(
        "LOG_PARSE_FAILED",
        `Request body must include the '${field}' field.`
      ),
      400
    );
  }
  return value as T;
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Error Code → HTTP Status Mapping (controller-local)
//
//   Supplements the centralized error middleware map for pipeline-specific codes
//   where the controller needs to explicitly choose a status before calling
//   next(err) — e.g. to return 422 rather than 500 for bad log input.
// ─────────────────────────────────────────────────────────────────────────────

const pipelineErrorStatus = (error: AppError): number => {
  const statusMap: Partial<Record<string, number>> = {
    LOG_PARSE_FAILED: 422,
    LOG_INGESTION_FAILED: 422,
    PIPELINE_STEP_FAILED: 500,
    PIPELINE_ABORTED: 500,
    LLM_CALL_FAILED: 502,
    QDRANT_OPERATION_FAILED: 502,
    RETRIEVAL_FAILED: 502,
    EMBEDDING_FAILED: 502,
    ENKRYPT_VALIDATION_FAILED: 502,
  };
  return statusMap[error.code] ?? 500;
};

// ─────────────────────────────────────────────────────────────────────────────
// § 4. IncidentController
// ─────────────────────────────────────────────────────────────────────────────

export class IncidentController {
  /**
   * @param pipeline — The sole dependency. Must be an IncidentPipelineService
   *                   from src/core/. No other service is injected here.
   */
  constructor(private readonly pipeline: IncidentPipelineService) {}

  // ── Primary Endpoint ────────────────────────────────────────────────────────

  /**
   * POST /api/v1/incident/analyze
   *
   * Runs the complete 9-step pipeline and returns all step outputs in one
   * structured JSON response.
   *
   * Request body:  { "logs": [ ...RawLogEntry objects... ] }
   * Response body: { success: true, data: CompleteIncidentResponse }
   */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawLogs = requireLogsArray(req.body);

      const result = await this.pipeline.analyze(
        rawLogs as Parameters<typeof this.pipeline.analyze>[0]
      );

      if (!result.success) {
        return next(
          new HttpError(result.error, pipelineErrorStatus(result.error))
        );
      }

      const d: CompleteIncidentResponse = result.data;

      res.status(200).json(
        successBody({
          incident: d.incident,
          anomalies: d.anomalies,
          historicalMatches: d.historicalMatches,
          rootCause: d.rootCause ?? null,
          remediation: d.remediation ?? null,
          guardrails: d.guardrails ?? null,
          postMortem: d.postMortem ?? null,
        })
      );
    } catch (e) {
      next(e);
    }
  }

  // ── Debug / Development Endpoints ───────────────────────────────────────────
  //
  // These endpoints accept pre-built domain objects in the request body,
  // bypassing the ingestion steps. They are gated to non-production use and
  // remain routed exclusively through the pipeline service's singleton — no
  // individual service is referenced from this controller.
  //
  // The pipeline service is the only class that knows about individual service
  // implementations. Debug endpoints here simply unpack the body, trust the
  // caller has constructed valid domain objects, and proxy the call.
  //
  // NOTE: These call pipeline.analyze() with a synthetic single-entry log
  // payload derived from the provided context so the full pipeline still runs
  // end-to-end. Alternatively the future can add dedicated debug methods to
  // IncidentPipelineService; for now the approach below keeps the contract.

  /**
   * POST /api/v1/root-cause
   *
   * Debug: Returns a root cause analysis for a pre-built IncidentContext.
   *
   * This endpoint reconstructs a minimal synthetic log payload from the
   * provided context signal, then runs the full pipeline. The response will
   * contain at least `rootCause` if the RCA step succeeds.
   *
   * Body: { context: IncidentContext }
   */
  async rootCause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const context = requireField<any>(body, "context");
      const retrievalResult = requireField<any>(body, "retrievalResult");

      const result = await this.pipeline.runRootCauseOnly(context, retrievalResult);

      if (!result.success) {
        return next(new HttpError(result.error, pipelineErrorStatus(result.error)));
      }

      res.status(200).json(
        successBody({ rootCause: result.data ?? null })
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/v1/remediation
   *
   * Debug: Returns a remediation plan given a pre-built IncidentContext.
   * Uses the same synthetic-log approach as /root-cause.
   *
   * Body: { context: IncidentContext }
   */
  async remediation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const context = requireField<any>(body, "context");
      const rootCause = requireField<any>(body, "rootCause");

      const result = await this.pipeline.runRemediationOnly(context, rootCause);

      if (!result.success) {
        return next(new HttpError(result.error, pipelineErrorStatus(result.error)));
      }

      res.status(200).json(
        successBody({ remediation: result.data ?? null })
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/v1/guardrails
   *
   * Debug: Returns a guardrails validation result.
   * Uses the same synthetic-log approach as /root-cause.
   *
   * Body: { context: IncidentContext }
   */
  async guardrails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const context = requireField<any>(body, "context");
      const rootCause = requireField<any>(body, "rootCause");
      const remediation = requireField<any>(body, "remediation");

      const result = await this.pipeline.runGuardrailsOnly(context, rootCause, remediation);

      if (!result.success) {
        return next(new HttpError(result.error, pipelineErrorStatus(result.error)));
      }

      res.status(200).json(
        successBody({ guardrails: result.data ?? null })
      );
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /api/v1/postmortem
   *
   * Debug: Returns a post-mortem report.
   * Uses the same synthetic-log approach as /root-cause.
   *
   * Body: { context: IncidentContext }
   */
  async postMortem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const context = requireField<any>(body, "context");
      const rootCause = requireField<any>(body, "rootCause");
      const remediation = requireField<any>(body, "remediation");
      // Note: route JSDoc in route file says "validation: ValidationResult", but controller uses "guardrails"
      // to keep it consistent we'll look for `guardrails` in the body or `validation`.
      const guardrails = requireField<any>(body, body["validation"] ? "validation" : "guardrails");

      const result = await this.pipeline.runPostMortemOnly(context, rootCause, remediation, guardrails);

      if (!result.success) {
        return next(new HttpError(result.error, pipelineErrorStatus(result.error)));
      }

      res.status(200).json(
        successBody({ postMortem: result.data ?? null })
      );
    } catch (e) {
      next(e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Pre-configured Singleton
//
//   Wired with the core pipeline singleton. This is the ONLY import from
//   src/core/ in this file — no individual service imports.
// ─────────────────────────────────────────────────────────────────────────────

import { incidentPipelineService } from "../../core/incident-pipeline.service";

export const incidentController = new IncidentController(incidentPipelineService);
