/**
 * src/api/middleware/error.middleware.ts
 *
 * PURPOSE:
 *   Centralized Express error-handling middleware.
 *   Catches all errors propagated via next(err) and converts them into a
 *   consistent JSON error envelope.
 *
 * DESIGN DECISIONS:
 *   • Single responsibility — this middleware only serialises errors; it never
 *     contains business logic.
 *   • AppError-aware mapping — when the error carries an AppError shape the
 *     code and message are forwarded verbatim. Arbitrary errors are wrapped in
 *     UNKNOWN_ERROR so callers always receive the same shape.
 *   • HttpError wrapper — allows any part of the application to attach an HTTP
 *     status code to an AppError before calling next(err).
 *   • Never leaks stack traces to the client in production — stacks are
 *     included in the JSON body only in development mode.
 *   • 4-argument signature — Express identifies error-handling middleware by
 *     the presence of exactly four parameters (err, req, res, next).
 *
 * DEPENDENCY RULE:
 *   Imports from types/common only.
 *   Never imports from services, models, contracts, mastra, or config.
 */

import type { Request, Response, NextFunction } from "express";
import type { AppError, ErrorCode } from "../../types/common";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. HTTP-aware error wrapper
//
//   Controllers and services may call next(new HttpError(appError, 422)) to
//   attach a specific HTTP status code. The middleware unwraps the AppError
//   from this container.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An error that carries both an AppError payload and an HTTP status code.
 * Thrown (or passed to next()) by controllers that need to control the
 * status code explicitly.
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly appError: AppError;

  constructor(appError: AppError, statusCode = 500) {
    super(appError.message);
    this.name = "HttpError";
    this.appError = appError;
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Error Code → HTTP Status Mapping
//
//   Maps domain error codes to semantically correct HTTP status codes.
//   Any code not in this map falls back to 500 Internal Server Error.
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODE_TO_HTTP_STATUS: Partial<Record<ErrorCode, number>> = {
  LOG_PARSE_FAILED: 422,
  LOG_INGESTION_FAILED: 422,
  ANOMALY_DETECTION_FAILED: 500,
  EMBEDDING_FAILED: 502,
  QDRANT_OPERATION_FAILED: 502,
  RETRIEVAL_FAILED: 502,
  LLM_CALL_FAILED: 502,
  ENKRYPT_VALIDATION_FAILED: 502,
  PIPELINE_STEP_FAILED: 500,
  PIPELINE_ABORTED: 500,
  INCIDENT_NOT_FOUND: 404,
  INCIDENT_INVALID_STATE_TRANSITION: 409,
  ENV_VALIDATION_FAILED: 500,
  SERIALIZATION_FAILED: 500,
  UNKNOWN_ERROR: 500,
};

/**
 * Resolve the HTTP status code for a given AppError code.
 */
const resolveStatusCode = (code: ErrorCode, fallback = 500): number =>
  ERROR_CODE_TO_HTTP_STATUS[code] ?? fallback;

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Standard Error Response Shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorResponseBody {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details: Record<string, unknown>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Error Middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Express error-handling middleware.
 *
 * Must be registered AFTER all routes via `app.use(errorMiddleware)`.
 * Express identifies this as an error handler because it has 4 parameters.
 *
 * @param err  — The caught error (may be HttpError, AppError-shaped plain
 *               object, or an arbitrary Error / unknown).
 * @param _req — The incoming request (unused).
 * @param res  — The outgoing response.
 * @param _next — Required by Express signature; not called in an error handler.
 */
export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isDev = process.env["NODE_ENV"] === "development";

  // ── Case 1: HttpError (carries an AppError + explicit status code) ─────────
  if (err instanceof HttpError) {
    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: err.appError.code,
        message: err.appError.message,
        details: {
          ...(err.appError.context !== undefined
            ? { context: err.appError.context }
            : {}),
          ...(isDev && err.stack !== undefined ? { stack: err.stack } : {}),
        },
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // ── Case 2: AppError-shaped plain object ──────────────────────────────────
  if (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    "message" in err &&
    typeof (err as Record<string, unknown>)["code"] === "string" &&
    typeof (err as Record<string, unknown>)["message"] === "string"
  ) {
    const appErr = err as AppError;
    const statusCode = resolveStatusCode(appErr.code);
    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: appErr.code,
        message: appErr.message,
        details: {
          ...(appErr.context !== undefined ? { context: appErr.context } : {}),
        },
      },
    };
    res.status(statusCode).json(body);
    return;
  }

  // ── Case 3: Standard Error object ─────────────────────────────────────────
  if (err instanceof Error) {
    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: err.message,
        details: {
          ...(isDev && err.stack !== undefined ? { stack: err.stack } : {}),
        },
      },
    };
    res.status(500).json(body);
    return;
  }

  // ── Case 4: Completely unknown throw ──────────────────────────────────────
  const body: ErrorResponseBody = {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
      details: {
        ...(isDev ? { raw: String(err) } : {}),
      },
    },
  };
  res.status(500).json(body);
};
