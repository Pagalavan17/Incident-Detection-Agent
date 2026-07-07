/**
 * src/contracts/incident.contract.ts
 *
 * PURPOSE:
 *   Defines the core domain contracts for an incident: its lifecycle states,
 *   valid state transitions, classification metadata, and the interface shapes
 *   that every incident-related service must satisfy.
 *
 *   A "contract" in this architecture is an interface or enum that defines a
 *   behavioural boundary without providing an implementation. Concrete classes
 *   in service layers implement these contracts, enabling easy substitution
 *   and testing (Dependency Inversion Principle).
 *
 * DESIGN DECISIONS:
 *   • IncidentLifecycle enum       — closed set of lifecycle states with a
 *     finite-state-machine (FSM) guard function. Invalid transitions are caught
 *     at runtime and typed at compile time.
 *   • AnomalySignal                — lightweight detection result; intentionally
 *     decoupled from the full NormalisedLogEntry to keep the anomaly contract
 *     focused and testable in isolation.
 *   • RemediationAction            — first-class domain object, not a plain
 *     string. Carries confidence, safety flags, and validation state so the
 *     Enkrypt layer can enrich it without reimplementing the base shape.
 *   • RootCauseAnalysis            — represents the output of the LLM RCA step.
 *     Typed separately so it can be embedded in IncidentContext cleanly.
 *
 * DEPENDENCY RULE:
 *   Only imports from types/common and types/log.
 *   Never import from models, events, core, services, mastra, or api.
 */

import type {
  AppError,
  CorrelationId,
  EpochMs,
  ErrorCode,
  IncidentId,
  ISODateString,
  Priority,
  Result,
  RunId,
  Severity,
} from "../types/common";
import type { NormalisedLogEntry, ParsedLogBatch } from "../types/log";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Incident Lifecycle — Finite State Machine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The strongly-typed lifecycle of an incident from detection to closure.
 *
 * Valid transition graph:
 *
 *   DETECTED ──────► TRIAGING ──────► ANALYSING ──────► REMEDIATING
 *      │                │                  │                  │
 *      │                │                  │                  ▼
 *      │                │                  │            VALIDATED ──► RESOLVED
 *      │                │                  │                  │
 *      │                ▼                  ▼                  ▼
 *      └──────────────────────────────► FAILED
 *                                          │
 *                                          ▼
 *                                       CLOSED
 *
 * Any state can also transition to CLOSED (e.g. false-positive resolution).
 */
export enum IncidentLifecycle {
  /**
   * An anomaly signal has been detected and an incident record created.
   * This is always the initial state.
   */
  DETECTED = "DETECTED",

  /**
   * The incident is being triaged: severity assigned, on-call notified,
   * and relevant log batches collected.
   */
  TRIAGING = "TRIAGING",

  /**
   * Root cause analysis is in progress (LLM call + similarity search).
   */
  ANALYSING = "ANALYSING",

  /**
   * Remediation actions have been generated and are awaiting execution.
   */
  REMEDIATING = "REMEDIATING",

  /**
   * Remediation actions have been validated by Enkrypt AI Guardrails.
   * Safe to act on.
   */
  VALIDATED = "VALIDATED",

  /**
   * The incident has been resolved: systems back to normal.
   * Post-mortem generation begins from this state.
   */
  RESOLVED = "RESOLVED",

  /**
   * An unrecoverable error occurred during a pipeline step.
   * A human must intervene. Details in IncidentContext.errors[].
   */
  FAILED = "FAILED",

  /**
   * The incident record has been closed (either resolved or false-positive).
   * Terminal state — no further transitions allowed.
   */
  CLOSED = "CLOSED",
}

/**
 * The complete finite-state-machine transition table.
 * Only transitions listed here are legal; all others are rejected.
 *
 * Key   : current state
 * Value : set of states the incident may transition to from the current state
 */
const VALID_TRANSITIONS: Readonly<
  Record<IncidentLifecycle, ReadonlySet<IncidentLifecycle>>
> = {
  [IncidentLifecycle.DETECTED]: new Set([
    IncidentLifecycle.TRIAGING,
    IncidentLifecycle.FAILED,
    IncidentLifecycle.CLOSED,
  ]),
  [IncidentLifecycle.TRIAGING]: new Set([
    IncidentLifecycle.ANALYSING,
    IncidentLifecycle.FAILED,
    IncidentLifecycle.CLOSED,
  ]),
  [IncidentLifecycle.ANALYSING]: new Set([
    IncidentLifecycle.REMEDIATING,
    IncidentLifecycle.FAILED,
    IncidentLifecycle.CLOSED,
  ]),
  [IncidentLifecycle.REMEDIATING]: new Set([
    IncidentLifecycle.VALIDATED,
    IncidentLifecycle.FAILED,
    IncidentLifecycle.CLOSED,
  ]),
  [IncidentLifecycle.VALIDATED]: new Set([
    IncidentLifecycle.RESOLVED,
    IncidentLifecycle.FAILED,
    IncidentLifecycle.CLOSED,
  ]),
  [IncidentLifecycle.RESOLVED]: new Set([IncidentLifecycle.CLOSED]),
  [IncidentLifecycle.FAILED]: new Set([IncidentLifecycle.CLOSED]),
  // CLOSED is terminal — no outgoing transitions.
  [IncidentLifecycle.CLOSED]: new Set<IncidentLifecycle>(),
};

/**
 * Guard function — returns Ok(nextState) if the transition is legal,
 * or Err(AppError) if it is not.
 *
 * Usage:
 *   const result = validateTransition(current, IncidentLifecycle.TRIAGING);
 *   if (isErr(result)) { handle error }
 */
export const validateTransition = (
  current: IncidentLifecycle,
  next: IncidentLifecycle
): Result<IncidentLifecycle> => {
  const allowed = VALID_TRANSITIONS[current];
  if (allowed.has(next)) {
    return { success: true, data: next };
  }
  return {
    success: false,
    error: {
      code: "INCIDENT_INVALID_STATE_TRANSITION" satisfies ErrorCode,
      message: `Invalid lifecycle transition: ${current} → ${next}. Allowed: [${[...allowed].join(", ")}]`,
    },
  };
};

/** Returns true if the incident is in a terminal state (CLOSED). */
export const isTerminalState = (state: IncidentLifecycle): boolean =>
  state === IncidentLifecycle.CLOSED;

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Anomaly Signal
//
//   Produced by the anomaly detection service.
//   Lightweight — carries only what is needed to open an incident.
// ─────────────────────────────────────────────────────────────────────────────

/** The type of anomaly detected from log analysis. */
export enum AnomalyType {
  /** A statistically abnormal spike in a metric or log rate. */
  SPIKE = "SPIKE",
  /** A sudden drop to near-zero for a metric that should be non-zero. */
  DROP = "DROP",
  /** A repeating error pattern not seen in baseline. */
  PATTERN = "PATTERN",
  /** Absence of expected log entries (e.g. health-check silence). */
  SILENCE = "SILENCE",
  /** Latency exceeding defined thresholds. */
  LATENCY = "LATENCY",
  /** Any anomaly type not covered by the above categories. */
  GENERIC = "GENERIC",
}

/** The result produced by the anomaly detection service for a log batch. */
export interface AnomalySignal {
  /** Unique ID of this anomaly signal. */
  readonly id: string;
  /** The category of anomaly detected. */
  readonly type: AnomalyType;
  /** Human-readable description of what was detected. */
  readonly description: string;
  /** Confidence score [0.0 – 1.0] produced by the detector. */
  readonly confidence: number;
  /** The severity inferred from the anomaly. */
  readonly severity: Severity;
  /** Timestamp when the anomaly was detected. */
  readonly detectedAt: EpochMs;
  /** The subset of log entries that triggered this signal. */
  readonly triggeringEntries: ReadonlyArray<NormalisedLogEntry>;
  /**
   * Optional key-value metadata specific to the detection algorithm.
   * Examples: { "threshold": 500, "baseline_p99_ms": 120 }
   */
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Similar Incident (Retrieval Result)
//
//   Produced by the vector similarity search step.
//   References past incidents stored in Qdrant.
// ─────────────────────────────────────────────────────────────────────────────

/** A past incident retrieved by semantic similarity from the vector store. */
export interface SimilarIncident {
  /** The incident ID as stored in Qdrant. */
  readonly incidentId: IncidentId;
  /** Cosine similarity score [0.0 – 1.0]. Higher is more similar. */
  readonly similarity: number;
  /** Brief summary of the past incident stored at indexing time. */
  readonly summary: string;
  /**
   * The root cause identified during the original incident response.
   * May be undefined for incidents resolved before RCA was introduced.
   */
  readonly rootCause?: string | undefined;
  /**
   * The remediation actions that resolved the past incident.
   * Ordered by effectiveness (most effective first).
   */
  readonly remediations: ReadonlyArray<string>;
  /** When the past incident occurred. */
  readonly occurredAt: ISODateString;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Root Cause Analysis
//
//   The structured output of the LLM-powered RCA step.
//   Used both in IncidentContext and in the post-mortem generator.
// ─────────────────────────────────────────────────────────────────────────────

/** The confidence level of a root cause conclusion. */
export enum RCAConfidence {
  HIGH = "HIGH",     // > 0.85 — strong supporting evidence
  MEDIUM = "MEDIUM", // 0.60 – 0.85 — moderate evidence
  LOW = "LOW",       // < 0.60 — hypothesis only; human review required
}

/** Structured output of the LLM root cause analysis step. */
export interface RootCauseAnalysis {
  /** One-sentence summary of the root cause. */
  readonly summary: string;
  /**
   * Multi-paragraph detailed explanation, including:
   *   - What happened
   *   - Why it happened
   *   - What systems were affected
   */
  readonly explanation: string;
  /** The model's confidence level in this conclusion. */
  readonly confidence: RCAConfidence;
  /**
   * Contributing factors ordered by estimated impact.
   * Each entry is a human-readable description.
   */
  readonly contributingFactors: ReadonlyArray<string>;
  /**
   * Log entry IDs that most strongly support this conclusion.
   * Used for evidence linking in the post-mortem report.
   */
  readonly evidenceEntryIds: ReadonlyArray<string>;
  /** Timestamp when the RCA was generated. */
  readonly generatedAt: EpochMs;
  /**
   * The LLM model identifier used for this analysis.
   * Example: "claude-3-5-sonnet-20241022"
   */
  readonly modelUsed: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Remediation Action
//
//   First-class domain object representing a proposed remediation step.
//   Carries its own validation state so Enkrypt can enrich in-place
//   without the pipeline needing to reconstruct the shape.
// ─────────────────────────────────────────────────────────────────────────────

/** The validation status of a remediation action from Enkrypt AI. */
export enum RemediationValidationStatus {
  /** Not yet sent to Enkrypt for validation. */
  PENDING = "PENDING",
  /** Enkrypt has approved this action as safe. */
  APPROVED = "APPROVED",
  /** Enkrypt has rejected this action as potentially harmful. */
  REJECTED = "REJECTED",
  /** Enkrypt returned a result but flagged concerns — human review needed. */
  NEEDS_REVIEW = "NEEDS_REVIEW",
}

/** A single proposed remediation action produced by the LLM. */
export interface RemediationAction {
  /** Unique identifier for this action within the incident. */
  readonly id: string;
  /**
   * Short, imperative description of the action.
   * Example: "Roll back payments-api to v2.3.1"
   */
  readonly title: string;
  /**
   * Detailed, step-by-step instructions for executing the action.
   */
  readonly description: string;
  /**
   * The specific command(s) to run, if the action is automatable.
   * May be undefined for actions requiring human judgement.
   */
  readonly command?: string | undefined;
  /**
   * LLM-estimated confidence that this action will resolve the incident [0–1].
   */
  readonly confidence: number;
  /**
   * True if this action can be executed without human approval.
   * Governed by the ENABLE_AUTO_REMEDIATION environment variable.
   */
  readonly isAutomatable: boolean;
  /**
   * The estimated risk level of executing this action.
   * HIGH risk actions always require human approval regardless of automation flag.
   */
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
  /** The current validation status from Enkrypt AI. */
  readonly validationStatus: RemediationValidationStatus;
  /**
   * Enkrypt AI's assessment notes, populated after validation.
   */
  readonly validationNotes?: string | undefined;
  /** Ordering hint — lower number = higher priority. */
  readonly priority: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Service Contracts (Interfaces)
//
//   Abstract interfaces that each service module must implement.
//   Following the Dependency Inversion Principle: high-level modules (the
//   pipeline, agents) depend on these abstractions, not concrete services.
// ─────────────────────────────────────────────────────────────────────────────

/** Contract for the log ingestion service. */
export interface ILogIngestionService {
  /**
   * Ingest a raw batch of log data from a given source and return a
   * normalised ParsedLogBatch.
   */
  ingest(batch: {
    source: string;
    sourceId: string;
    rawEntries: ReadonlyArray<Readonly<Record<string, unknown>>>;
  }): Promise<Result<ParsedLogBatch>>;
}

/** Contract for the anomaly detection service. */
export interface IAnomalyDetectionService {
  /**
   * Analyse a normalised log batch and return any detected anomaly signals.
   * Returns an empty array if no anomalies are found (not an error).
   */
  detect(batch: ParsedLogBatch): Promise<Result<ReadonlyArray<AnomalySignal>>>;
}

/** Contract for the root cause analysis service. */
export interface IRCAService {
  /**
   * Given an anomaly signal and relevant log context, generate a structured
   * root cause analysis using an LLM.
   */
  analyse(input: {
    signal: AnomalySignal;
    logContext: ReadonlyArray<NormalisedLogEntry>;
    similarIncidents: ReadonlyArray<SimilarIncident>;
  }): Promise<Result<RootCauseAnalysis>>;
}

/** Contract for the remediation service. */
export interface IRemediationService {
  /**
   * Generate a ranked list of remediation actions for a given RCA result.
   */
  generate(input: {
    rca: RootCauseAnalysis;
    signal: AnomalySignal;
    incidentId: IncidentId;
  }): Promise<Result<ReadonlyArray<RemediationAction>>>;
}

/** Contract for the Enkrypt AI guardrails validation service. */
export interface IGuardrailsService {
  /**
   * Validate a list of remediation actions through Enkrypt AI.
   * Returns the same actions with updated validationStatus fields.
   */
  validate(
    actions: ReadonlyArray<RemediationAction>
  ): Promise<Result<ReadonlyArray<RemediationAction>>>;
}

/** Input required to create a new incident. */
export interface CreateIncidentInput {
  readonly correlationId: CorrelationId;
  readonly signal: AnomalySignal;
  readonly logBatch: ParsedLogBatch;
  readonly priority: Priority;
  readonly runId: RunId;
}

/** Snapshot of an incident stored in the repository layer. */
export interface IncidentSnapshot {
  readonly id: IncidentId;
  readonly correlationId: CorrelationId;
  readonly lifecycle: IncidentLifecycle;
  readonly priority: Priority;
  readonly severity: Severity;
  readonly title: string;
  readonly createdAt: EpochMs;
  readonly updatedAt: EpochMs;
  readonly resolvedAt?: EpochMs | undefined;
}

/** Error specific to an incident operation — narrows AppError.code. */
export type IncidentError = AppError & {
  readonly code:
    | "INCIDENT_NOT_FOUND"
    | "INCIDENT_INVALID_STATE_TRANSITION";
};
