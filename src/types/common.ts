/**
 * src/types/common.ts
 *
 * PURPOSE:
 *   The shared type vocabulary for the entire application.
 *   Contains only pure TypeScript — no runtime logic, no imports from other
 *   internal modules. This is the guaranteed-acyclic root of the dependency graph.
 *
 * DESIGN DECISIONS:
 *   • Branded types  — prevent accidental interchanging of IDs that are all
 *     "strings" at the JavaScript level (e.g. IncidentId vs. CorrelationId).
 *   • Result<T, E>   — explicit success/failure modelling instead of thrown
 *     exceptions. Makes error paths visible in the type system.
 *   • Readonly everywhere — immutability by default; mutation is opt-in.
 *   • No class constructors — this file exports only types and interfaces
 *     to keep it import-free and tree-shakeable.
 *
 * DEPENDENCY RULE:
 *   This file MUST NOT import from any other src/ module.
 *   Every other module MAY import from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Branded Primitive Types
//
//   A "brand" is a phantom type tag that makes two structurally identical types
//   (e.g. two plain strings) incompatible at the type level without any runtime
//   overhead. This prevents bugs where, for example, a CorrelationId is passed
//   where an IncidentId is expected.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal branding mechanism. The unique symbol ensures the brand cannot be
 * accidentally satisfied by any external type.
 */
declare const __brand: unique symbol;

/** Generic branded type utility. */
type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

/** UUID-shaped string identifying a unique incident. */
export type IncidentId = Brand<string, "IncidentId">;

/** UUID-shaped string correlating events within one incident scope. */
export type CorrelationId = Brand<string, "CorrelationId">;

/** UUID-shaped string identifying a specific pipeline execution run. */
export type RunId = Brand<string, "RunId">;

/** Milliseconds since the Unix epoch — avoids raw `number` confusion. */
export type EpochMs = Brand<number, "EpochMs">;

/**
 * Safe constructor for IncidentId.
 * Call this at the ingestion boundary (e.g. when creating an incident from
 * a raw API payload) — never create IDs inline with a plain cast.
 */
export const toIncidentId = (raw: string): IncidentId => raw as IncidentId;

/** Safe constructor for CorrelationId. */
export const toCorrelationId = (raw: string): CorrelationId =>
  raw as CorrelationId;

/** Safe constructor for RunId. */
export const toRunId = (raw: string): RunId => raw as RunId;

/** Safe constructor for EpochMs. */
export const toEpochMs = (raw: number): EpochMs => raw as EpochMs;

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Result Monad
//
//   Explicit success/failure type that eliminates invisible throw paths.
//   All service-layer functions return Result<T, AppError> instead of throwing.
//   Callers are forced to handle the error case before accessing the value.
// ─────────────────────────────────────────────────────────────────────────────

/** Discriminated union representing an operation that succeeded. */
export interface Ok<T> {
  readonly success: true;
  readonly data: T;
}

/** Discriminated union representing an operation that failed. */
export interface Err<E> {
  readonly success: false;
  readonly error: E;
}

/** A value that is either Ok<T> or Err<E>. */
export type Result<T, E = AppError> = Ok<T> | Err<E>;

/** Smart constructor — wrap a value in Ok. */
export const ok = <T>(data: T): Ok<T> => ({ success: true, data });

/** Smart constructor — wrap an error in Err. */
export const err = <E>(error: E): Err<E> => ({ success: false, error });

/** Type guard — narrows Result<T,E> to Ok<T>. */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> =>
  result.success === true;

/** Type guard — narrows Result<T,E> to Err<E>. */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
  result.success === false;

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Structured Error Type
//
//   All errors in the system are AppError instances. The `code` field is a
//   machine-readable constant used for monitoring and alerting; `message` is
//   human-readable; `cause` preserves the original exception chain.
// ─────────────────────────────────────────────────────────────────────────────

/** Every error code in the system. Extend this union as new modules are added. */
export type ErrorCode =
  | "ENV_VALIDATION_FAILED"
  | "INCIDENT_NOT_FOUND"
  | "INCIDENT_INVALID_STATE_TRANSITION"
  | "LOG_PARSE_FAILED"
  | "LOG_INGESTION_FAILED"
  | "ANOMALY_DETECTION_FAILED"
  | "EMBEDDING_FAILED"
  | "QDRANT_OPERATION_FAILED"
  | "RETRIEVAL_FAILED"
  | "LLM_CALL_FAILED"
  | "ENKRYPT_VALIDATION_FAILED"
  | "PIPELINE_STEP_FAILED"
  | "PIPELINE_ABORTED"
  | "SERIALIZATION_FAILED"
  | "UNKNOWN_ERROR";

/** The canonical error shape used across all service boundaries. */
export interface AppError {
  /** Machine-readable identifier for monitoring/alerting. */
  readonly code: ErrorCode;
  /** Human-readable description of the failure. */
  readonly message: string;
  /** Optional: the original error that caused this one. */
  readonly cause?: unknown;
  /** Optional: structured metadata for debugging. */
  readonly context?: Readonly<Record<string, unknown>>;
}

/** Factory — create a well-formed AppError. */
export const makeError = (
  code: ErrorCode,
  message: string,
  options?: { cause?: unknown; context?: Record<string, unknown> }
): AppError => ({
  code,
  message,
  ...(options?.cause !== undefined ? { cause: options.cause } : {}),
  ...(options?.context !== undefined
    ? { context: Object.freeze({ ...options.context }) }
    : {}),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Severity & Priority Enums
//
//   Shared across logs, incidents, and alerts. Defined once here to avoid
//   divergent definitions across service boundaries.
// ─────────────────────────────────────────────────────────────────────────────

/** Operational severity of a log entry or incident. */
export enum Severity {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

/** Priority tier used for scheduling incident response. */
export enum Priority {
  P1 = "P1", // Severity: Critical — immediate response required
  P2 = "P2", // Severity: High — response within 30 minutes
  P3 = "P3", // Severity: Medium — response within 4 hours
  P4 = "P4", // Severity: Low — response within next business day
}

/**
 * Map a Severity to the appropriate Priority tier.
 * Used when auto-classifying an incident from log severity.
 */
export const severityToPriority = (severity: Severity): Priority => {
  const map: Record<Severity, Priority> = {
    [Severity.CRITICAL]: Priority.P1,
    [Severity.ERROR]: Priority.P2,
    [Severity.WARN]: Priority.P3,
    [Severity.INFO]: Priority.P4,
    [Severity.DEBUG]: Priority.P4,
  };
  return map[severity];
};

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Pagination & Metadata Utilities
//
//   Generic, reusable shapes for paginated API responses and operational
//   metadata. Framework-agnostic — no Express or HTTP dependency.
// ─────────────────────────────────────────────────────────────────────────────

/** Standard pagination metadata attached to list responses. */
export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

/** Wraps an array result with pagination metadata. */
export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly pagination: PaginationMeta;
}

/** ISO 8601 datetime string — used in serialised payloads and reports. */
export type ISODateString = Brand<string, "ISODateString">;

/** Safe constructor for ISODateString from a Date object. */
export const toISODateString = (date: Date): ISODateString =>
  date.toISOString() as ISODateString;

/** Convert EpochMs to a Date object. */
export const epochMsToDate = (ms: EpochMs): Date => new Date(ms);

/** Get the current time as EpochMs. */
export const nowEpochMs = (): EpochMs => Date.now() as EpochMs;
