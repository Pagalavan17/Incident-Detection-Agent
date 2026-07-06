/**
 * src/contracts/workflow.contract.ts
 *
 * PURPOSE:
 *   Defines the reusable, generic interfaces for workflow inputs, outputs,
 *   and step definitions. These abstractions decouple the orchestration layer
 *   (Mastra workflows, the generic pipeline) from any specific business logic.
 *
 *   A "workflow" in this system is a directed sequence of named steps that
 *   transforms an input into an output, with each step able to fail gracefully
 *   using the Result type rather than throwing.
 *
 * DESIGN DECISIONS:
 *   • WorkflowInput/Output are generic — the same contract describes any
 *     workflow in the system (ingestion, RCA, remediation, post-mortem).
 *   • StepResult carries both the step name and duration — critical for
 *     OpenTelemetry span correlation and performance monitoring.
 *   • WorkflowContext is intentionally minimal — only the fields that every
 *     workflow step needs access to, regardless of domain.
 *   • IWorkflowStep is a single-method interface (ISP) — each step does
 *     exactly one thing and can be tested in complete isolation.
 *
 * DEPENDENCY RULE:
 *   Only imports from types/common and contracts/incident.contract.
 *   Never import from models, events, core, services, mastra, or api.
 */

import type {
  AppError,
  CorrelationId,
  EpochMs,
  Result,
  RunId,
} from "../types/common.ts";
import type { IncidentLifecycle } from "./incident.contract.ts";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Workflow Execution Context
//
//   Metadata injected into every workflow run — available to all steps without
//   being part of the domain payload. Analogous to HTTP request context.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execution-scoped metadata available to every workflow step.
 * Passed through the pipeline via the WorkflowInput envelope.
 */
export interface WorkflowContext {
  /** Unique identifier for this specific pipeline run. */
  readonly runId: RunId;
  /** Cross-cutting trace identifier linking all events in this run. */
  readonly correlationId: CorrelationId;
  /** Wall-clock timestamp when the workflow run was started. */
  readonly startedAt: EpochMs;
  /**
   * Maximum number of retries for transient errors in individual steps.
   * Defaults to 0 — steps must explicitly opt-in to retry logic.
   */
  readonly maxRetries: number;
  /**
   * Timeout in milliseconds for the entire workflow run.
   * Undefined means no timeout.
   */
  readonly timeoutMs?: number | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Generic Workflow Input / Output Envelopes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The envelope wrapping any workflow's domain input payload.
 *
 * @template TPayload — The domain-specific input type for this workflow.
 *
 * Example:
 *   WorkflowInput<{ logBatch: ParsedLogBatch; signal: AnomalySignal }>
 */
export interface WorkflowInput<TPayload = unknown> {
  /** Execution context shared across all steps. */
  readonly context: WorkflowContext;
  /** The domain-specific data this workflow operates on. */
  readonly payload: TPayload;
}

/**
 * The envelope wrapping any workflow's domain output payload.
 *
 * @template TPayload — The domain-specific output type for this workflow.
 */
export interface WorkflowOutput<TPayload = unknown> {
  /** The run ID this output belongs to, for traceability. */
  readonly runId: RunId;
  /** Whether the workflow completed successfully. */
  readonly success: boolean;
  /** The domain-specific result data (present when success=true). */
  readonly payload?: TPayload | undefined;
  /** The error that caused the workflow to fail (present when success=false). */
  readonly error?: AppError | undefined;
  /** The lifecycle state the incident was in when the workflow completed. */
  readonly finalLifecycle: IncidentLifecycle;
  /** Ordered record of each step's execution result. */
  readonly stepResults: ReadonlyArray<StepResult>;
  /** Wall-clock timestamp when the workflow completed. */
  readonly completedAt: EpochMs;
  /** Total elapsed time for the workflow run in milliseconds. */
  readonly durationMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Step Result — Per-Step Execution Record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The execution record for a single workflow step.
 * Collected into WorkflowOutput.stepResults for observability.
 */
export interface StepResult<TOutput = unknown> {
  /** The unique name of the step (must match the IWorkflowStep.name). */
  readonly stepName: string;
  /** Whether this step completed without error. */
  readonly success: boolean;
  /** The step's output value on success. */
  readonly output?: TOutput | undefined;
  /** The error on failure. */
  readonly error?: AppError | undefined;
  /** Wall-clock time when this step started. */
  readonly startedAt: EpochMs;
  /** Wall-clock time when this step completed or failed. */
  readonly completedAt: EpochMs;
  /** Duration of this step in milliseconds. */
  readonly durationMs: number;
  /** Number of retries attempted before this result (0 = first try succeeded). */
  readonly retryCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. IWorkflowStep — Single-Step Interface (ISP)
//
//   The Interface Segregation Principle in action:
//   Each step only needs to implement `execute` and expose its `name`.
//   The pipeline calls these — steps don't know about each other.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contract for a single, composable workflow step.
 *
 * @template TInput  — The shape of data this step consumes.
 * @template TOutput — The shape of data this step produces on success.
 *
 * Rules for implementors:
 *   1. NEVER throw — return Err(...) instead.
 *   2. Be idempotent where possible.
 *   3. Rely only on the injected services, not on module-level globals.
 *   4. The `name` property must be unique within a workflow definition.
 */
export interface IWorkflowStep<TInput = unknown, TOutput = unknown> {
  /**
   * Unique, kebab-case identifier for this step.
   * Used in StepResult records and OpenTelemetry span names.
   * Example: "anomaly-detection", "root-cause-analysis"
   */
  readonly name: string;

  /**
   * Execute this step.
   *
   * @param input  — The domain value this step operates on.
   * @param context — The workflow execution context.
   * @returns Result<TOutput> — Ok with the step's output, or Err with a
   *           structured AppError. Never rejects the Promise.
   */
  execute(
    input: TInput,
    context: WorkflowContext
  ): Promise<Result<TOutput>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. IWorkflow — Full Workflow Interface
//
//   Composes multiple IWorkflowStep implementations into an end-to-end flow.
//   The pipeline.ts generic class provides the default implementation.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contract for a complete workflow — an ordered sequence of steps.
 *
 * @template TInput  — The workflow's overall domain input payload type.
 * @template TOutput — The workflow's overall domain output payload type.
 */
export interface IWorkflow<TInput = unknown, TOutput = unknown> {
  /**
   * Unique, kebab-case name for this workflow.
   * Example: "incident-response", "post-mortem-generation"
   */
  readonly name: string;

  /**
   * Execute the full workflow.
   *
   * @param input  — Wrapped workflow input (payload + context).
   * @returns WorkflowOutput<TOutput> — always resolves, never rejects.
   */
  run(input: WorkflowInput<TInput>): Promise<WorkflowOutput<TOutput>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Workflow Registry Types
//
//   A workflow registry maps workflow names to their factory functions.
//   Used by the API layer to look up and execute named workflows.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Known workflow identifiers in the system.
 * Extend this union as new workflows are added in later modules.
 */
export type WorkflowName =
  | "incident-response"
  | "post-mortem-generation"
  | "remediation-validation";

/** A factory function that produces an IWorkflow instance. */
export type WorkflowFactory<TInput = unknown, TOutput = unknown> = () => IWorkflow<TInput, TOutput>;

/**
 * Registry mapping workflow names to their factory functions.
 * The API layer resolves workflows by name at request time.
 */
export type WorkflowRegistry = Readonly<
  Partial<Record<WorkflowName, WorkflowFactory>>
>;
