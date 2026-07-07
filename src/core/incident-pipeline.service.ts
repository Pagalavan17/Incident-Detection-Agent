/**
 * src/core/incident-pipeline.service.ts
 *
 * PURPOSE:
 *   The canonical orchestration layer for the entire incident-response pipeline.
 *
 *   This service sits between the API layer and the individual domain services,
 *   sequencing each step and wiring outputs together without owning any domain
 *   logic itself.
 *
 * LAYER POSITION:
 *
 *   ┌──────────────────────────────────────┐
 *   │         HTTP Layer (Express)         │
 *   │   Routes → Controllers               │
 *   └──────────────┬───────────────────────┘
 *                  │  depends on ↓ only
 *   ┌──────────────▼───────────────────────┐
 *   │   IncidentPipelineService   ← HERE   │
 *   │   src/core/incident-pipeline.service │
 *   └──────────────┬───────────────────────┘
 *                  │  depends on ↓ only
 *   ┌──────────────▼───────────────────────┐
 *   │         Domain Services              │
 *   │  parser · validator · normaliser     │
 *   │  anomaly · retrieval · rca           │
 *   │  remediation · guardrails · pm       │
 *   └──────────────────────────────────────┘
 *
 * PUBLIC API:
 *   analyze(logs: ReadonlyArray<RawLogEntry>)
 *     → Promise<Result<CompleteIncidentResponse, AppError>>
 *
 * DESIGN DECISIONS:
 *   • Single public method — the pipeline exposes exactly one entry point.
 *     Controllers call nothing else; they never interact with individual services.
 *   • Typed response — CompleteIncidentResponse is the explicit contract between
 *     the orchestrator and the HTTP layer. All fields except `incident` and
 *     `anomalies` are optional because the pipeline degrades gracefully when an
 *     AI step fails (best-effort output vs. hard failure).
 *   • Non-fatal step failures — retrieval, RCA, remediation, guardrails, and
 *     post-mortem failures do NOT abort the pipeline. They leave the
 *     corresponding field undefined in the response, which the controller maps
 *     to `null` in the JSON body for explicit client visibility.
 *   • Fatal step failures — parse and validate failures ARE fatal because there
 *     are no logs to analyse; the pipeline returns Err(AppError) immediately.
 *   • Sentinel signal — when no rule-based anomalies are found, a synthetic
 *     GENERIC signal is created so the IncidentContext can always be constructed.
 *     This allows the LLM steps to run and produce a report even for "healthy"
 *     log batches submitted for review.
 *   • Constructor injection — every domain-service dependency is passed in.
 *     The module-level singleton at the bottom of this file wires the real
 *     singletons. Tests substitute mocks without patching module globals.
 *   • No imports from api/ — this file must never import from src/api/ to keep
 *     the dependency graph acyclic.
 *
 * DEPENDENCY RULE:
 *   MAY import from: services/, models/, types/, contracts/, constants/.
 *   MUST NOT import from: api/, mastra/, config/ (except indirectly via services).
 */

import { randomUUID } from "node:crypto";
import type { Result, AppError } from "../types/common";
import {
  ok,
  err,
  makeError,
  toIncidentId,
  toCorrelationId,
  toRunId,
  nowEpochMs,
  severityToPriority,
  Severity,
  toISODateString,
  epochMsToDate,
} from "../types/common";
import type { RawLogEntry, NormalisedLogEntry } from "../types/log";
import type { AnomalySignal, SimilarIncident } from "../contracts/incident.contract";
import { IncidentLifecycle, AnomalyType } from "../contracts/incident.contract";
import type { IncidentContext } from "../models/IncidentContext";
import { createIncidentContext } from "../models/IncidentContext";
import type { RootCauseAnalysis } from "../types/root-cause";
import type { RemediationPlan } from "../types/remediation";
import type { ValidationResult } from "../types/guardrails";
import type { PostMortemReport } from "../types/postmortem";

import { LogParser } from "../services/logs/parser";
import { LogValidator } from "../services/logs/validator";
import { LogNormaliser } from "../services/logs/normalizer";
import { AnomalyDetector } from "../services/anomaly/anomaly-detector";
import type { RetrievalService, RetrievalResult } from "../services/retrieval/retrieval.service";
import type { RootCauseService } from "../services/llm/root-cause.service";
import type { RemediationService } from "../services/llm/remediation.service";
import type { GuardrailsService } from "../services/enkrypt/guardrails.service";
import type { PostMortemService } from "../services/llm/postmortem.service";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Public Contract: CompleteIncidentResponse
//
//   This is THE typed output of the pipeline. Controllers, tests, and any
//   future gRPC or event-bus adaptor depend on this shape — not on any internal
//   intermediate type.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete, ordered output of one incident-analysis pipeline run.
 *
 * Fields are populated progressively as pipeline steps succeed. A step failure
 * leaves the field `undefined` without aborting subsequent independent steps.
 *
 * Callers (controllers) serialise `undefined` fields as `null` in JSON
 * responses to make the absence explicit to API consumers.
 */
export interface CompleteIncidentResponse {
  /**
   * The IncidentContext assembled from the first detected anomaly signal.
   * Always present — if this field cannot be populated, the pipeline returns
   * Err(AppError) instead of Ok(CompleteIncidentResponse).
   */
  readonly incident: IncidentContext;

  /**
   * All rule-based anomaly signals detected from the normalised log batch.
   * Empty array when no rule fires; never undefined.
   */
  readonly anomalies: ReadonlyArray<AnomalySignal>;

  /**
   * Semantically similar historical incidents retrieved from Qdrant.
   * Empty array when retrieval fails or returns no matches; never undefined.
   */
  readonly historicalMatches: ReadonlyArray<SimilarIncident>;

  /**
   * Structured root cause analysis generated by the LLM.
   * Undefined if the RCA step did not run or failed.
   */
  readonly rootCause?: RootCauseAnalysis | undefined;

  /**
   * Operational remediation plan generated by the LLM.
   * Undefined if the remediation step did not run or failed.
   */
  readonly remediation?: RemediationPlan | undefined;

  /**
   * Safety validation result from Enkrypt AI Guardrails.
   * Undefined if the guardrails step did not run or failed.
   */
  readonly guardrails?: ValidationResult | undefined;

  /**
   * Structured post-mortem report generated by the LLM.
   * Undefined if the post-mortem step did not run or failed.
   */
  readonly postMortem?: PostMortemReport | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Internal Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a GENERIC sentinel AnomalySignal when no rule-based anomaly fires.
 *
 * This lets the pipeline always produce an IncidentContext — even for "clean"
 * log batches — so the LLM steps can still provide analytical value.
 */
const buildSentinelSignal = (
  entries: ReadonlyArray<NormalisedLogEntry>
): AnomalySignal => ({
  id: randomUUID(),
  type: AnomalyType.GENERIC,
  description: "Log batch submitted for analysis — no rule-based anomalies detected.",
  confidence: 0,
  severity: Severity.INFO,
  detectedAt: nowEpochMs(),
  // Include up to the first 5 entries as context for the LLM steps.
  triggeringEntries: entries.slice(0, 5),
});

/**
 * Build a zero-match RetrievalResult for use when Qdrant is unavailable.
 * This keeps the RCA step alive with reduced context.
 */
const buildEmptyRetrieval = (context: IncidentContext): RetrievalResult => ({
  queryIncidentId: context.id,
  matches: [],
  searchedAt: toISODateString(epochMsToDate(nowEpochMs())),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 3. IncidentPipelineService
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the complete 9-step incident-response pipeline.
 *
 * This class is the ONLY class that controllers may depend on for incident
 * analysis. It is forbidden for controllers to import or instantiate individual
 * domain services (parser, validator, detector, etc.).
 *
 * @example
 *   const response = await incidentPipelineService.analyze(rawLogs);
 *   if (response.success) {
 *     // response.data: CompleteIncidentResponse
 *   }
 */
export class IncidentPipelineService {
  // Stateless pipeline utilities — instantiated once per service lifetime.
  private readonly parser: LogParser;
  private readonly validator: LogValidator;
  private readonly normaliser: LogNormaliser;
  private readonly anomalyDetector: AnomalyDetector;

  constructor(
    private readonly retrievalSvc: RetrievalService,
    private readonly rootCauseSvc: RootCauseService,
    private readonly remediationSvc: RemediationService,
    private readonly guardrailsSvc: GuardrailsService,
    private readonly postMortemSvc: PostMortemService
  ) {
    this.parser = new LogParser();
    this.validator = new LogValidator();
    this.normaliser = new LogNormaliser();
    this.anomalyDetector = new AnomalyDetector();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Run the complete incident-response pipeline for a batch of raw log entries.
   *
   * @param logs — Raw log entries as received at the API boundary. The entries
   *               are typed as `ReadonlyArray<RawLogEntry>` (parsed JSON objects).
   *               Completely unknown values that arrive via HTTP are coerced to
   *               this type by the controller before calling here.
   *
   * @returns Ok(CompleteIncidentResponse) — all successfully completed steps.
   *          Err(AppError)               — only when parse OR validate produces
   *                                        zero usable records (hard failure).
   */
  async analyze(
    logs: ReadonlyArray<RawLogEntry>
  ): Promise<Result<CompleteIncidentResponse, AppError>> {

    // ── Step 1: Parse ──────────────────────────────────────────────────────────
    const parseBatch = this.parser.parseBatch(logs);

    if (parseBatch.successCount === 0) {
      return err(
        makeError(
          "LOG_PARSE_FAILED",
          `All ${parseBatch.total} log entr${parseBatch.total === 1 ? "y" : "ies"} failed to parse. ` +
          "Ensure every entry is a non-null JSON object.",
          { context: { total: parseBatch.total, failureCount: parseBatch.failureCount } }
        )
      );
    }

    // ── Step 2: Validate ───────────────────────────────────────────────────────
    const validateBatch = this.validator.validateBatch(parseBatch.successes);

    if (validateBatch.validCount === 0) {
      return err(
        makeError(
          "LOG_INGESTION_FAILED",
          `All ${parseBatch.successCount} parsed entr${parseBatch.successCount === 1 ? "y" : "ies"} ` +
          "failed schema validation. Each entry requires 'level', 'message', 'service', and 'host'.",
          {
            context: {
              parsedCount: parseBatch.successCount,
              invalidCount: validateBatch.invalidCount,
            },
          }
        )
      );
    }

    // ── Step 3: Normalise ──────────────────────────────────────────────────────
    const { entries: normalisedEntries } = this.normaliser.normaliseBatch(
      validateBatch.valid
    );

    // ── Step 4: Detect Anomalies ───────────────────────────────────────────────
    const anomalies = this.anomalyDetector.detect(normalisedEntries);

    // Select the highest-confidence signal as the primary incident driver.
    // Fall back to a sentinel when no rule fires.
    const primarySignal: AnomalySignal =
      anomalies.length > 0
        ? anomalies.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : buildSentinelSignal(normalisedEntries);

    const incidentContext: IncidentContext = createIncidentContext({
      id: toIncidentId(randomUUID()),
      correlationId: toCorrelationId(randomUUID()),
      runId: toRunId(randomUUID()),
      lifecycle: IncidentLifecycle.DETECTED,
      priority: severityToPriority(primarySignal.severity),
      severity: primarySignal.severity,
      title: primarySignal.description,
      signal: primarySignal,
      detectedAt: nowEpochMs(),
    });

    // ── Step 5: Retrieve Historical Incidents ──────────────────────────────────
    const retrievalResult = await this.retrievalSvc.retrieveSimilarIncidents(
      incidentContext,
      { limit: 5, threshold: 0.7 }
    );

    const retrieval: RetrievalResult = retrievalResult.success
      ? retrievalResult.data
      : buildEmptyRetrieval(incidentContext);

    const historicalMatches: ReadonlyArray<SimilarIncident> = retrievalResult.success
      ? retrieval.matches
      : [];

    // ── Step 6: Root Cause Analysis ────────────────────────────────────────────
    const rcaResult = await this.rootCauseSvc.analyzeRootCause(
      incidentContext,
      retrieval
    );

    if (!rcaResult.success) {
      return ok({ incident: incidentContext, anomalies, historicalMatches });
    }

    const rootCause: RootCauseAnalysis = rcaResult.data;

    // ── Step 7: Remediation Recommendation ────────────────────────────────────
    const remediationResult = await this.remediationSvc.recommendRemediation(
      incidentContext,
      rootCause
    );

    if (!remediationResult.success) {
      return ok({ incident: incidentContext, anomalies, historicalMatches, rootCause });
    }

    const remediation: RemediationPlan = remediationResult.data;

    // ── Step 8: Guardrails Validation ──────────────────────────────────────────
    const guardrailsResult = await this.guardrailsSvc.validateOutputs(
      incidentContext,
      rootCause,
      remediation
    );

    if (!guardrailsResult.success) {
      return ok({
        incident: incidentContext,
        anomalies,
        historicalMatches,
        rootCause,
        remediation,
      });
    }

    const guardrails: ValidationResult = guardrailsResult.data;

    // ── Step 9: Post-Mortem Generation ─────────────────────────────────────────
    const postMortemResult = await this.postMortemSvc.generatePostMortem(
      incidentContext,
      rootCause,
      remediation,
      guardrails
    );

    if (!postMortemResult.success) {
      return ok({
        incident: incidentContext,
        anomalies,
        historicalMatches,
        rootCause,
        remediation,
        guardrails,
      });
    }

    // ── Complete pipeline ───────────────────────────────────────────────────────
    return ok({
      incident: incidentContext,
      anomalies,
      historicalMatches,
      rootCause,
      remediation,
      guardrails,
      postMortem: postMortemResult.data,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Pre-wired Singleton
//
//   Composes the service with the production singletons exported by each
//   domain module. This is the composition root for the orchestration layer.
//   Tests substitute individual service mocks by constructing a fresh instance.
// ─────────────────────────────────────────────────────────────────────────────

import { retrievalService } from "../services/retrieval/retrieval.service";
import { rootCauseService } from "../services/llm/root-cause.service";
import { remediationService } from "../services/llm/remediation.service";
import { guardrailsService } from "../services/enkrypt/guardrails.service";
import { postMortemService } from "../services/llm/postmortem.service";

/**
 * The production-configured singleton.
 * Import this in controllers and any other adapter that needs the full pipeline.
 */
export const incidentPipelineService = new IncidentPipelineService(
  retrievalService,
  rootCauseService,
  remediationService,
  guardrailsService,
  postMortemService
);
