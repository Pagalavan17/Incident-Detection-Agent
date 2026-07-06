/**
 * src/models/IncidentContext.ts
 *
 * PURPOSE:
 *   IncidentContext is the canonical state object that flows through the
 *   entire incident response pipeline. It is created at detection time and
 *   progressively enriched by each pipeline step — from anomaly signals
 *   through RCA to remediation and post-mortem generation.
 *
 *   Think of it as the "incident file": everything known about a single
 *   incident at any point in time, in one place.
 *
 * DESIGN DECISIONS:
 *   • Single-object state         — one IncidentContext per incident. No need
 *     to join multiple disparate data structures in the pipeline.
 *   • Readonly base, mutable via factory  — the context itself is deeply
 *     readonly to prevent accidental mutation inside steps. The `update()`
 *     factory creates a new copy with overrides (immutable update pattern).
 *   • Optional enrichment fields  — fields populated by later pipeline steps
 *     (e.g. rca, remediations) are Optional. This makes it explicit which
 *     steps have run and allows partial processing if a step fails.
 *   • Explicit error log          — every pipeline step records errors into
 *     context.errors[], preserving the full failure history for debugging.
 *   • Separation of concerns      — IncidentContext is a data model, not a
 *     service. It has no methods that call external systems.
 *
 * DEPENDENCY RULE:
 *   Imports from contracts/incident.contract and types/common and types/log.
 *   Never import from events, core, services, mastra, api, or config.
 */

import type {
  AppError,
  CorrelationId,
  EpochMs,
  IncidentId,
  Priority,
  RunId,
  Severity,
} from "../types/common.ts";
import type { NormalisedLogEntry, ParsedLogBatch } from "../types/log.ts";
import type {
  AnomalySignal,
  IncidentLifecycle,
  RemediationAction,
  RootCauseAnalysis,
  SimilarIncident,
} from "../contracts/incident.contract.ts";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Pipeline Step Record
//
//   Each step the context has passed through is recorded here, providing an
//   audit trail of the incident's journey through the system.
// ─────────────────────────────────────────────────────────────────────────────

/** Status of a single pipeline step execution. */
export type PipelineStepStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

/** Audit record for one pipeline step applied to this IncidentContext. */
export interface PipelineStepRecord {
  /** Step identifier matching IWorkflowStep.name. */
  readonly stepName: string;
  /** Current execution status. */
  readonly status: PipelineStepStatus;
  /** When this step started processing this context. */
  readonly startedAt: EpochMs;
  /** When this step finished (undefined while RUNNING). */
  readonly completedAt?: EpochMs | undefined;
  /** Duration in milliseconds (undefined while RUNNING). */
  readonly durationMs?: number | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Post-Mortem Draft
//
//   Partially populated during the RESOLVED phase. The post-mortem generator
//   enriches this object and finalises it as a formatted document.
// ─────────────────────────────────────────────────────────────────────────────

/** A partially or fully generated post-mortem report. */
export interface PostMortemDraft {
  /** One-sentence incident title for the post-mortem title. */
  readonly title: string;
  /** Executive summary — 2-3 sentences for leadership audiences. */
  readonly executiveSummary: string;
  /** Detailed timeline of events from detection to resolution. */
  readonly timeline: ReadonlyArray<TimelineEntry>;
  /** The root cause as stated in the post-mortem. */
  readonly rootCause: string;
  /** The impact on users/systems: e.g. "Payments API 503 for 12 min". */
  readonly impact: string;
  /**
   * Actions that resolved the incident — ordered list.
   */
  readonly resolutionSteps: ReadonlyArray<string>;
  /**
   * Action items to prevent recurrence. Each item has an owner and due date.
   */
  readonly actionItems: ReadonlyArray<PostMortemActionItem>;
  /** Whether this draft has been reviewed and approved. */
  readonly isApproved: boolean;
  /** ISO datetime when the post-mortem was generated. */
  readonly generatedAt: EpochMs;
}

/** A single event in the incident timeline. */
export interface TimelineEntry {
  /** When this event occurred. */
  readonly timestamp: EpochMs;
  /** Description of what happened at this moment. */
  readonly description: string;
  /** Who or what system performed this action. */
  readonly actor: "SYSTEM" | "ON_CALL_ENGINEER" | "AUTO_REMEDIATION";
}

/** A follow-up action item from the post-mortem. */
export interface PostMortemActionItem {
  /** Description of the action to take. */
  readonly description: string;
  /** Who is responsible. */
  readonly owner: string;
  /** Target completion date (ISO 8601). */
  readonly dueDate: string;
  /** Priority of the action item. */
  readonly priority: "HIGH" | "MEDIUM" | "LOW";
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. IncidentContext — The Core State Object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The single state object that represents everything known about an incident
 * at a given point in time. All pipeline steps receive this object and return
 * an updated copy — they never mutate it in place.
 *
 * LIFECYCLE MAPPING:
 *   DETECTED    → id, correlationId, runId, signal, priority, severity
 *   TRIAGING    → logBatch enriched, title set, on-call context added
 *   ANALYSING   → similarIncidents, rca populated
 *   REMEDIATING → remediations populated
 *   VALIDATED   → remediations updated with validationStatus
 *   RESOLVED    → resolvedAt set, postMortemDraft populated
 *   CLOSED      → final state, no further changes
 *   FAILED      → errors[] has at least one entry
 */
export interface IncidentContext {
  // ── Identity ──────────────────────────────────────────────────────────────

  /** Unique identifier for this incident. Set at detection time. */
  readonly id: IncidentId;

  /**
   * Correlation ID linking all events, logs, and spans in this incident scope.
   */
  readonly correlationId: CorrelationId;

  /** The run ID of the pipeline execution that created this context. */
  readonly runId: RunId;

  // ── Classification ────────────────────────────────────────────────────────

  /** Current lifecycle state. Updated by validateTransition() at each step. */
  readonly lifecycle: IncidentLifecycle;

  /** Response priority tier. Set from the anomaly signal at detection time. */
  readonly priority: Priority;

  /** Inferred severity level. Set from the anomaly signal at detection time. */
  readonly severity: Severity;

  /**
   * Short, human-readable incident title.
   * Generated from the anomaly signal description during TRIAGING.
   */
  readonly title: string;

  // ── Timestamps ────────────────────────────────────────────────────────────

  /** When the anomaly signal was first detected and this context was created. */
  readonly detectedAt: EpochMs;

  /** When the incident was last updated by any pipeline step. */
  readonly updatedAt: EpochMs;

  /** When the incident reached RESOLVED state. Undefined if not yet resolved. */
  readonly resolvedAt?: EpochMs | undefined;

  // ── Pipeline Data — Populated Progressively ───────────────────────────────

  /**
   * The anomaly signal that triggered this incident.
   * Always present — set at detection time.
   */
  readonly signal: AnomalySignal;

  /**
   * The normalised log batch associated with this incident.
   * Set during TRIAGING after the log ingestion service runs.
   */
  readonly logBatch?: ParsedLogBatch | undefined;

  /**
   * A curated subset of log entries most relevant to this incident.
   * Populated during ANALYSING — may be a filtered subset of logBatch.entries.
   */
  readonly relevantLogs?: ReadonlyArray<NormalisedLogEntry> | undefined;

  /**
   * Similar past incidents retrieved from the Qdrant vector store.
   * Populated during ANALYSING as context for the LLM RCA step.
   */
  readonly similarIncidents?: ReadonlyArray<SimilarIncident> | undefined;

  /**
   * The root cause analysis result produced by the LLM.
   * Populated during ANALYSING after a successful RCA call.
   */
  readonly rca?: RootCauseAnalysis | undefined;

  /**
   * The list of proposed remediation actions.
   * Populated during REMEDIATING after the LLM generates suggestions.
   */
  readonly remediations?: ReadonlyArray<RemediationAction> | undefined;

  /**
   * The post-mortem draft.
   * Populated during RESOLVED when the post-mortem generator runs.
   */
  readonly postMortemDraft?: PostMortemDraft | undefined;

  // ── Observability ─────────────────────────────────────────────────────────

  /**
   * Ordered record of all pipeline steps that have processed this context.
   * Used for audit trails and performance analysis.
   */
  readonly pipelineHistory: ReadonlyArray<PipelineStepRecord>;

  /**
   * All errors encountered during processing, in chronological order.
   * Present regardless of current lifecycle — even RESOLVED incidents may
   * have partial errors from retried steps.
   */
  readonly errors: ReadonlyArray<AppError>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. IncidentContext Factory Functions
//
//   All mutations to IncidentContext must go through these factory functions.
//   This enforces the immutable-update pattern and ensures every update
//   automatically refreshes updatedAt.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The minimum data required to initialise a new IncidentContext at detection.
 */
export interface CreateIncidentContextInput {
  readonly id: IncidentId;
  readonly correlationId: CorrelationId;
  readonly runId: RunId;
  readonly lifecycle: IncidentLifecycle;
  readonly priority: Priority;
  readonly severity: Severity;
  readonly title: string;
  readonly signal: AnomalySignal;
  readonly detectedAt: EpochMs;
}

/**
 * Create a fresh IncidentContext from the minimum required fields.
 * All optional enrichment fields are undefined; errors and history are empty.
 *
 * @param input — The detection-time data.
 * @returns     — A new, immutable IncidentContext.
 */
export const createIncidentContext = (
  input: CreateIncidentContextInput
): IncidentContext => ({
  id: input.id,
  correlationId: input.correlationId,
  runId: input.runId,
  lifecycle: input.lifecycle,
  priority: input.priority,
  severity: input.severity,
  title: input.title,
  signal: input.signal,
  detectedAt: input.detectedAt,
  updatedAt: input.detectedAt,
  pipelineHistory: [],
  errors: [],
});

/**
 * Produce a new IncidentContext with the given overrides applied.
 * The `updatedAt` field is always refreshed to the current time.
 *
 * This is the ONLY way to "mutate" an IncidentContext in the pipeline.
 * Steps receive the current context and return the updated copy.
 *
 * @param current   — The existing context to derive from.
 * @param overrides — Partial fields to override (updatedAt is set automatically).
 * @param nowMs     — Optional timestamp to use for updatedAt (defaults to Date.now()).
 * @returns         — A new IncidentContext with overrides applied.
 */
export const updateIncidentContext = (
  current: IncidentContext,
  overrides: Partial<Omit<IncidentContext, "id" | "correlationId" | "runId" | "detectedAt" | "updatedAt">>,
  nowMs?: EpochMs
): IncidentContext => ({
  ...current,
  ...overrides,
  updatedAt: nowMs ?? (Date.now() as EpochMs),
});

/**
 * Append an error to the context's error log without changing lifecycle.
 * Used when a pipeline step fails but the incident should continue.
 *
 * @param current — The existing context.
 * @param error   — The error to record.
 * @param nowMs   — Optional timestamp override.
 */
export const recordError = (
  current: IncidentContext,
  error: AppError,
  nowMs?: EpochMs
): IncidentContext =>
  updateIncidentContext(
    current,
    { errors: [...current.errors, error] },
    nowMs
  );

/**
 * Append a step record to the pipeline history.
 *
 * @param current — The existing context.
 * @param step    — The step record to append.
 * @param nowMs   — Optional timestamp override.
 */
export const recordStep = (
  current: IncidentContext,
  step: PipelineStepRecord,
  nowMs?: EpochMs
): IncidentContext =>
  updateIncidentContext(
    current,
    { pipelineHistory: [...current.pipelineHistory, step] },
    nowMs
  );
