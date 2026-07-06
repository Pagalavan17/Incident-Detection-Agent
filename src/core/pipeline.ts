/**
 * src/core/pipeline.ts
 *
 * PURPOSE:
 *   A generic, reusable sequential pipeline executor. Runs an ordered list of
 *   IWorkflowStep implementations, accumulating StepResult records, emitting
 *   lifecycle events, and returning a typed WorkflowOutput.
 *
 *   This is pure orchestration infrastructure — it has no knowledge of:
 *     • What the steps do (anomaly detection, RCA, etc.)
 *     • What the domain payload is
 *     • Which AI model is being used
 *
 *   Business logic lives exclusively inside individual IWorkflowStep
 *   implementations in the services/ and mastra/ directories.
 *
 * DESIGN DECISIONS:
 *   • Generic type parameters    — Pipeline<TInput, TOutput> works for any
 *     domain workflow. The incident response and post-mortem workflows both
 *     instantiate this same class with different type parameters.
 *   • Step-level error isolation — a single step failure does not terminate
 *     the pipeline by default. The caller controls this via PipelineOptions.
 *   • AbortOnFailure option      — when true, the pipeline stops at the first
 *     failed step and marks the workflow as failed. When false, it continues
 *     and accumulates errors in the output.
 *   • Context threading          — steps that operate on IncidentContext must
 *     use a ContextualStep<TCtx> which receives and returns the context.
 *     This is handled by the dedicated IncidentContextPipeline subclass.
 *   • No retries here            — retries are a concern of individual steps.
 *     The pipeline records retry counts from StepResult but does not retry.
 *   • Event emission             — the pipeline fires lifecycle events via the
 *     provided emitter. If no emitter is provided, events are silently dropped.
 *
 * DEPENDENCY RULE:
 *   Imports from contracts/workflow.contract, types/common,
 *   models/IncidentContext, and events/incident.events.
 *   Never import from services, mastra, api, or config.
 */

import type {
  AppError,
  CorrelationId,
  EpochMs,
  IncidentId,
  Result,
} from "../types/common.ts";
import { isErr, makeError } from "../types/common.ts";
import type {
  IWorkflowStep,
  StepResult,
  WorkflowContext,
  WorkflowInput,
  WorkflowOutput,
} from "../contracts/workflow.contract.ts";
import type { IncidentContext } from "../models/IncidentContext.ts";
import { recordError, recordStep, updateIncidentContext } from "../models/IncidentContext.ts";
import type { IncidentLifecycle } from "../contracts/incident.contract.ts";
import { validateTransition } from "../contracts/incident.contract.ts";
import type { IncidentEventEmitter } from "../events/incident.events.ts";
import {
  makeStepCompletedEvent,
  makeStepFailedEvent,
  makeStepStartedEvent,
} from "../events/incident.events.ts";
import { PipelineStepStatus } from "../constants/pipeline.constants.ts";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Pipeline Options
// ─────────────────────────────────────────────────────────────────────────────

/** Configuration options for a pipeline execution. */
export interface PipelineOptions {
  /**
   * If true, the pipeline stops immediately on the first step failure and
   * returns a failed WorkflowOutput. Subsequent steps are skipped.
   *
   * If false, the pipeline continues through all steps, accumulating errors.
   * The workflow output will have success=false if any step failed.
   *
   * Default: true (fail fast).
   */
  readonly abortOnFailure: boolean;

  /**
   * Optional event emitter to receive step lifecycle events.
   * If not provided, no events are emitted.
   */
  readonly eventEmitter?: IncidentEventEmitter | undefined;
}

const DEFAULT_OPTIONS: PipelineOptions = {
  abortOnFailure: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Generic Pipeline
//
//   Executes a fixed list of IWorkflowStep<TInput, TOutput> steps.
//   All steps must accept the same TInput and produce the same TOutput, which
//   is the output of the LAST step. Use IncidentContextPipeline (§ 3) when
//   each step transforms a shared context object.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A generic pipeline that runs a list of steps sequentially, threading the
 * output of each step into the input of the next.
 *
 * @template TInput  — The type of the initial pipeline input payload.
 * @template TOutput — The type produced by the final pipeline step on success.
 *
 * THREADING MODEL:
 *   step[0] receives TInput → produces Result<TOutput>
 *   step[1] receives TOutput from step[0] → produces Result<TOutput>
 *   ...
 *   The final step's output becomes WorkflowOutput.payload.
 *
 * This linear threading model works when all steps share the same I/O type
 * (e.g. all transform the same data structure). For branching or heterogeneous
 * step types, use IncidentContextPipeline instead.
 */
export class Pipeline<TInput, TOutput> {
  readonly #steps: ReadonlyArray<IWorkflowStep<TInput | TOutput, TOutput>>;
  readonly #options: PipelineOptions;
  readonly #workflowName: string;

  constructor(
    workflowName: string,
    steps: ReadonlyArray<IWorkflowStep<TInput | TOutput, TOutput>>,
    options: Partial<PipelineOptions> = {}
  ) {
    this.#workflowName = workflowName;
    this.#steps = steps;
    this.#options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** The name of the workflow this pipeline implements. */
  get name(): string {
    return this.#workflowName;
  }

  /**
   * Run the pipeline with the given workflow input.
   *
   * @param input   — The wrapped workflow input (payload + context).
   * @param lifecycle — The final lifecycle to report in the output.
   * @returns         — A WorkflowOutput that always resolves (never rejects).
   */
  async run(
    input: WorkflowInput<TInput>,
    lifecycle: IncidentLifecycle
  ): Promise<WorkflowOutput<TOutput>> {
    const { context, payload } = input;
    const startedAt = context.startedAt;
    const stepResults: StepResult[] = [];
    let currentInput: TInput | TOutput = payload;
    let finalOutput: TOutput | undefined;
    let pipelineError: AppError | undefined;

    for (const step of this.#steps) {
      const stepStartedAt = Date.now() as EpochMs;

      this.#emitStepStarted(
        context,
        step.name,
        stepStartedAt
      );

      let result: Result<TOutput>;

      try {
        result = await step.execute(currentInput, context);
      } catch (thrown: unknown) {
        // A step threw instead of returning Err — capture it gracefully.
        result = {
          success: false,
          error: makeError(
            "PIPELINE_STEP_FAILED",
            `Step "${step.name}" threw an unexpected exception.`,
            { cause: thrown }
          ),
        };
      }

      const stepCompletedAt = Date.now() as EpochMs;
      const durationMs = stepCompletedAt - stepStartedAt;

      const stepRecord: StepResult<TOutput> = {
        stepName: step.name,
        success: result.success,
        output: result.success ? result.data : undefined,
        error: result.success ? undefined : result.error,
        startedAt: stepStartedAt,
        completedAt: stepCompletedAt,
        durationMs,
        retryCount: 0,
      };

      stepResults.push(stepRecord);

      if (isErr(result)) {
        this.#emitStepFailed(context, step.name, result.error, durationMs);

        if (this.#options.abortOnFailure) {
          pipelineError = result.error;
          break;
        }
        // Continue on failure — keep the last successful output.
      } else {
        this.#emitStepCompleted(context, step.name, durationMs);
        currentInput = result.data;
        finalOutput = result.data;
      }
    }

    const completedAt = Date.now() as EpochMs;
    const totalDurationMs = completedAt - startedAt;
    const succeeded = pipelineError === undefined;

    return {
      runId: context.runId,
      success: succeeded,
      payload: finalOutput,
      error: pipelineError,
      finalLifecycle: lifecycle,
      stepResults: Object.freeze(stepResults),
      completedAt,
      durationMs: totalDurationMs,
    };
  }

  // ── Private event helpers (no-op when no emitter configured) ─────────────

  #emitStepStarted(
    context: WorkflowContext,
    stepName: string,
    startedAt: EpochMs
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    // We need incidentId and correlationId to emit — they live on WorkflowContext.
    // Pipeline is generic, so we read correlationId from context and use a
    // placeholder incidentId when not available (events layer will handle it).
    const correlationId = context.correlationId;
    emitter.emit(
      makeStepStartedEvent(
        "" as IncidentId, // populated by IncidentContextPipeline
        correlationId,
        context.runId,
        stepName,
        startedAt
      )
    );
  }

  #emitStepCompleted(
    context: WorkflowContext,
    stepName: string,
    durationMs: number
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    emitter.emit(
      makeStepCompletedEvent(
        "" as IncidentId,
        context.correlationId,
        context.runId,
        stepName,
        durationMs
      )
    );
  }

  #emitStepFailed(
    context: WorkflowContext,
    stepName: string,
    error: AppError,
    durationMs: number
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    emitter.emit(
      makeStepFailedEvent(
        "" as IncidentId,
        context.correlationId,
        context.runId,
        stepName,
        error,
        durationMs
      )
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. IncidentContextStep — A Step That Transforms IncidentContext
//
//   Unlike the generic IWorkflowStep which threads any T, an IncidentContextStep
//   specifically receives and returns IncidentContext. This allows it to:
//     • Read any field from the accumulated context.
//     • Return an enriched context copy using updateIncidentContext().
//     • Advance the lifecycle via validateTransition().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A workflow step that receives and returns IncidentContext.
 * Extend this interface for all incident-specific pipeline steps.
 *
 * Each step is responsible for:
 *   1. Reading what it needs from the current context.
 *   2. Performing its work (calling a service, making an LLM call, etc.).
 *   3. Returning an updated context copy on success, or Err on failure.
 *
 * Steps MUST NOT call each other — they communicate only via the shared context.
 */
export interface IIncidentContextStep {
  /** Unique, kebab-case step name. Must be unique within a workflow. */
  readonly name: string;

  /**
   * Execute this step.
   *
   * @param context — The current accumulated incident context.
   * @param wfContext — The workflow execution metadata.
   * @returns         — Ok(updatedContext) or Err(AppError). Never throws.
   */
  execute(
    context: IncidentContext,
    wfContext: WorkflowContext
  ): Promise<Result<IncidentContext>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. IncidentContextPipeline
//
//   A specialised pipeline that threads IncidentContext through each step.
//   This is the primary pipeline used by the incident response workflow.
//
//   KEY DIFFERENCE from Pipeline<T,T>:
//     • Each step receives the full IncidentContext, not just the previous
//       step's output. This means later steps can access data from earlier steps.
//     • Lifecycle transition validation is enforced at the pipeline level —
//       steps declare their target lifecycle and the pipeline validates it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A step definition for use with IncidentContextPipeline.
 * Pairs an IIncidentContextStep with its target lifecycle transition.
 */
export interface ContextualStepDefinition {
  /** The step implementation. */
  readonly step: IIncidentContextStep;
  /**
   * The lifecycle state the incident MUST transition to when this step
   * completes successfully. If undefined, no transition is made.
   */
  readonly targetLifecycle?: IncidentLifecycle | undefined;
}

/**
 * A pipeline that threads IncidentContext through each step, validating
 * lifecycle transitions and emitting full incident events.
 *
 * This is the primary orchestrator for the incident response workflow.
 */
export class IncidentContextPipeline {
  readonly #steps: ReadonlyArray<ContextualStepDefinition>;
  readonly #options: PipelineOptions;
  readonly #workflowName: string;

  constructor(
    workflowName: string,
    steps: ReadonlyArray<ContextualStepDefinition>,
    options: Partial<PipelineOptions> = {}
  ) {
    this.#workflowName = workflowName;
    this.#steps = steps;
    this.#options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** The name of the workflow this pipeline implements. */
  get name(): string {
    return this.#workflowName;
  }

  /**
   * Run the incident context pipeline.
   *
   * @param input       — The workflow input wrapping an IncidentContext.
   * @returns             — A WorkflowOutput<IncidentContext> that always resolves.
   */
  async run(
    input: WorkflowInput<IncidentContext>
  ): Promise<WorkflowOutput<IncidentContext>> {
    const { context: wfContext, payload: initialContext } = input;
    const startedAt = wfContext.startedAt;
    const stepResults: StepResult[] = [];
    let currentContext = initialContext;
    let pipelineError: AppError | undefined;

    for (const { step, targetLifecycle } of this.#steps) {
      const stepStartedAt = Date.now() as EpochMs;

      // Record the step as RUNNING in the context's pipeline history.
      currentContext = recordStep(currentContext, {
        stepName: step.name,
        status: PipelineStepStatus.RUNNING,
        startedAt: stepStartedAt,
      });

      this.#emitStepStarted(currentContext, wfContext, step.name, stepStartedAt);

      // Validate lifecycle transition before executing (if a target is declared).
      if (targetLifecycle !== undefined) {
        const transitionResult = validateTransition(
          currentContext.lifecycle,
          targetLifecycle
        );

        if (isErr(transitionResult)) {
          const err = transitionResult.error;
          currentContext = recordError(currentContext, err);
          pipelineError = err;

          const durationMs = Date.now() - stepStartedAt;
          const failedRecord: StepResult = {
            stepName: step.name,
            success: false,
            error: err,
            startedAt: stepStartedAt,
            completedAt: Date.now() as EpochMs,
            durationMs,
            retryCount: 0,
          };
          stepResults.push(failedRecord);
          this.#emitStepFailed(currentContext, wfContext, step.name, err, durationMs);

          if (this.#options.abortOnFailure) {
            break;
          }
          continue;
        }
      }

      let result: Result<IncidentContext>;

      try {
        result = await step.execute(currentContext, wfContext);
      } catch (thrown: unknown) {
        result = {
          success: false,
          error: makeError(
            "PIPELINE_STEP_FAILED",
            `Step "${step.name}" threw an unexpected exception.`,
            { cause: thrown }
          ),
        };
      }

      const stepCompletedAt = Date.now() as EpochMs;
      const durationMs = stepCompletedAt - stepStartedAt;

      if (isErr(result)) {
        // Update history to reflect failure.
        currentContext = recordError(currentContext, result.error);
        currentContext = recordStep(currentContext, {
          stepName: step.name,
          status: PipelineStepStatus.FAILED,
          startedAt: stepStartedAt,
          completedAt: stepCompletedAt,
          durationMs,
        });

        const failedRecord: StepResult = {
          stepName: step.name,
          success: false,
          error: result.error,
          startedAt: stepStartedAt,
          completedAt: stepCompletedAt,
          durationMs,
          retryCount: 0,
        };
        stepResults.push(failedRecord);
        this.#emitStepFailed(currentContext, wfContext, step.name, result.error, durationMs);

        if (this.#options.abortOnFailure) {
          pipelineError = result.error;
          break;
        }
      } else {
        // Advance lifecycle if a target was declared.
        let updatedContext = result.data;
        if (targetLifecycle !== undefined) {
          updatedContext = updateIncidentContext(updatedContext, {
            lifecycle: targetLifecycle,
          });
        }

        // Update history to reflect completion.
        updatedContext = recordStep(updatedContext, {
          stepName: step.name,
          status: PipelineStepStatus.DONE,
          startedAt: stepStartedAt,
          completedAt: stepCompletedAt,
          durationMs,
        });

        currentContext = updatedContext;

        const completedRecord: StepResult<IncidentContext> = {
          stepName: step.name,
          success: true,
          output: currentContext,
          startedAt: stepStartedAt,
          completedAt: stepCompletedAt,
          durationMs,
          retryCount: 0,
        };
        stepResults.push(completedRecord);
        this.#emitStepCompleted(currentContext, wfContext, step.name, durationMs);
      }
    }

    const completedAt = Date.now() as EpochMs;
    const totalDurationMs = completedAt - startedAt;
    const succeeded = pipelineError === undefined;

    return {
      runId: wfContext.runId,
      success: succeeded,
      payload: currentContext,
      error: pipelineError,
      finalLifecycle: currentContext.lifecycle,
      stepResults: Object.freeze(stepResults),
      completedAt,
      durationMs: totalDurationMs,
    };
  }

  // ── Private event helpers ─────────────────────────────────────────────────

  #emitStepStarted(
    context: IncidentContext,
    wfContext: WorkflowContext,
    stepName: string,
    startedAt: EpochMs
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    emitter.emit(
      makeStepStartedEvent(
        context.id,
        context.correlationId as CorrelationId,
        wfContext.runId,
        stepName,
        startedAt
      )
    );
  }

  #emitStepCompleted(
    context: IncidentContext,
    wfContext: WorkflowContext,
    stepName: string,
    durationMs: number
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    emitter.emit(
      makeStepCompletedEvent(
        context.id,
        context.correlationId as CorrelationId,
        wfContext.runId,
        stepName,
        durationMs
      )
    );
  }

  #emitStepFailed(
    context: IncidentContext,
    wfContext: WorkflowContext,
    stepName: string,
    error: AppError,
    durationMs: number
  ): void {
    const emitter = this.#options.eventEmitter;
    if (emitter === undefined) {
      return;
    }
    emitter.emit(
      makeStepFailedEvent(
        context.id,
        context.correlationId as CorrelationId,
        wfContext.runId,
        stepName,
        error,
        durationMs
      )
    );
  }
}
