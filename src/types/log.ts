/**
 * src/types/log.ts
 *
 * PURPOSE:
 *   Canonical representation of a normalised log entry and related log-source
 *   metadata. All infrastructure-specific log adapters (CloudWatch, Datadog,
 *   raw JSON files, etc.) MUST produce a NormalisedLogEntry before any
 *   downstream processing can occur.
 *
 * DESIGN DECISIONS:
 *   • Normalised shape  — the single "translation target" for all log sources.
 *     Adapters translate; everything downstream consumes this shape.
 *   • LogSource enum    — closed set of known infrastructure origins. Adding a
 *     new source is an explicit, auditable change to this file.
 *   • RawLogEntry       — the opaque input shape before parsing; typed as
 *     Record<string, unknown> to be safely usable before validation.
 *   • ParsedLogBatch    — groups entries with their source metadata for bulk
 *     ingestion; avoids re-attaching metadata per-entry.
 *
 * DEPENDENCY RULE:
 *   Only imports from types/common.
 *   Never import from services, models, or contracts.
 */

import type {
  CorrelationId,
  EpochMs,
  ISODateString,
  Severity,
} from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Log Source Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Known infrastructure log sources.
 * Each value maps to a specific ingestion adapter in services/logs/.
 */
export enum LogSource {
  /** AWS CloudWatch Logs */
  CLOUDWATCH = "CLOUDWATCH",
  /** Datadog log stream */
  DATADOG = "DATADOG",
  /** Raw JSON file or stream (local dev / CI) */
  JSON_FILE = "JSON_FILE",
  /** Kubernetes pod logs via kubectl or a log aggregator */
  KUBERNETES = "KUBERNETES",
  /** Syslog-format entries from Linux/Unix hosts */
  SYSLOG = "SYSLOG",
  /** Application-level structured log emitted by Pino / Winston */
  APP_STRUCTURED = "APP_STRUCTURED",
  /** Any source not yet classified */
  UNKNOWN = "UNKNOWN",
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Raw Log Entry
//
//   The unvalidated, source-specific payload arriving from an adapter before
//   normalisation. Typed loosely so it can hold any JSON structure.
// ─────────────────────────────────────────────────────────────────────────────

/** Opaque input received from a log source before parsing. */
export type RawLogEntry = Readonly<Record<string, unknown>>;

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Normalised Log Entry
//
//   THE canonical shape that every log adapter must produce.
//   Downstream consumers (anomaly detection, RCA, embeddings) work only with
//   this type — never with raw, source-specific payloads.
// ─────────────────────────────────────────────────────────────────────────────

/** The normalised, source-agnostic representation of one log line. */
export interface NormalisedLogEntry {
  /**
   * Unique identifier for this log entry.
   * Populated by the adapter if the source provides one; otherwise generated
   * by the ingestion service using uuid v4.
   */
  readonly id: string;

  /**
   * The original source infrastructure system.
   * Allows downstream services to apply source-specific heuristics if needed.
   */
  readonly source: LogSource;

  /** Wall-clock timestamp when the log event occurred (milliseconds UTC). */
  readonly timestamp: EpochMs;

  /**
   * ISO 8601 string representation of the timestamp for human-readable output
   * and JSON serialisation.
   */
  readonly timestampIso: ISODateString;

  /** Normalised severity level. */
  readonly severity: Severity;

  /**
   * The human-readable log message body.
   * Multi-line messages are joined with '\n'.
   */
  readonly message: string;

  /**
   * The service, container, or process that emitted this log.
   * Examples: "payments-api", "nginx", "postgres-primary"
   */
  readonly service: string;

  /**
   * The host/node where the service was running when the log was emitted.
   * Examples: "ip-10-0-1-42", "k8s-node-3", "prod-web-01"
   */
  readonly host: string;

  /**
   * Optional trace/correlation identifier carried in the log.
   * Set by the adapter when the source log contains a trace ID header.
   */
  readonly correlationId?: CorrelationId | undefined;

  /**
   * Optional environment tag.
   * Examples: "production", "staging", "canary"
   */
  readonly environment?: string | undefined;

  /**
   * Optional structured metadata extracted from the raw log.
   * Examples: HTTP status codes, error codes, query durations.
   * Using ReadonlyRecord to enforce immutability.
   */
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;

  /**
   * The raw, unmodified log payload preserved for forensic purposes.
   * Stored alongside the normalised entry but never used in business logic.
   */
  readonly raw: RawLogEntry;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Log Batch
//
//   Ingestion is batch-oriented for efficiency. A ParsedLogBatch groups a set
//   of normalised entries with the metadata describing where they came from.
// ─────────────────────────────────────────────────────────────────────────────

/** Metadata about the origin of a batch of logs. */
export interface LogBatchMeta {
  /** The source infrastructure system. */
  readonly source: LogSource;

  /**
   * Identifier of the log group, stream, file, or topic from which the
   * batch was collected. Source-specific format.
   */
  readonly sourceId: string;

  /** Timestamp when the batch was collected by the ingestion service. */
  readonly collectedAt: EpochMs;

  /** Total number of raw entries before filtering/normalisation. */
  readonly rawEntryCount: number;
}

/**
 * A parsed and normalised batch ready for downstream processing.
 * Passed from the log-ingestion service into the anomaly detection pipeline.
 */
export interface ParsedLogBatch {
  readonly meta: LogBatchMeta;
  readonly entries: ReadonlyArray<NormalisedLogEntry>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Log Filter
//
//   Used by retrieval and query services to filter log collections.
//   Framework-agnostic — no query-string or HTTP dependency.
// ─────────────────────────────────────────────────────────────────────────────

/** Criteria for filtering a set of normalised log entries. */
export interface LogFilter {
  readonly sources?: ReadonlyArray<LogSource> | undefined;
  readonly severities?: ReadonlyArray<Severity> | undefined;
  readonly services?: ReadonlyArray<string> | undefined;
  readonly hosts?: ReadonlyArray<string> | undefined;
  readonly fromTimestamp?: EpochMs | undefined;
  readonly toTimestamp?: EpochMs | undefined;
  readonly messageContains?: string | undefined;
  readonly correlationId?: CorrelationId | undefined;
}
