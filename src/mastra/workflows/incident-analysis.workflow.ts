import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { LogSource } from "../../types/log";
import type { RawLog, ParseBatchResult } from "../../services/logs/parser";
import type { ValidatedLog, ValidationBatchResult } from "../../services/logs/validator";
import type { NormalisationBatchResult } from "../../services/logs/normalizer";
import {
  createIncidentContext,
  updateIncidentContext,
  recordError,
  recordStep,
  type IncidentContext,
} from "../../models/IncidentContext";
import {
  Severity,
  severityToPriority,
  nowEpochMs,
  toRunId,
  toIncidentId,
  toCorrelationId,
  toEpochMs,
} from "../../types/common";
import type { AppError } from "../../types/common";
import { AnomalyType, IncidentLifecycle } from "../../contracts/incident.contract";
import type { AnomalySignal } from "../../contracts/incident.contract";

import { LogParser } from "../../services/logs/parser";
import { LogValidator } from "../../services/logs/validator";
import { LogNormaliser } from "../../services/logs/normalizer";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Dependency Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ILogParser {
  parseBatch(rawEntries: ReadonlyArray<unknown>): ParseBatchResult;
}

export interface ILogValidator {
  validateBatch(rawLogs: ReadonlyArray<RawLog>): ValidationBatchResult;
}

export interface ILogNormaliser {
  normaliseBatch(validated: ReadonlyArray<ValidatedLog>): NormalisationBatchResult;
}

export interface WorkflowStepResult<T> {
  readonly success: boolean;
  readonly duration: number;
  readonly data?: T | undefined;
  readonly error?: AppError | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Workflow Builder
// ─────────────────────────────────────────────────────────────────────────────

export function createIncidentAnalysisWorkflow({
  parser,
  validator,
  normalizer,
}: {
  parser: ILogParser;
  validator: ILogValidator;
  normalizer: ILogNormaliser;
}) {
  const parserStep = createStep({
    id: "parser",
    inputSchema: z.object({
      rawLogs: z.array(z.any()),
      source: z.nativeEnum(LogSource).optional(),
      sourceId: z.string().optional(),
    }),
    outputSchema: z.any(),
    execute: async ({ inputData }): Promise<WorkflowStepResult<ParseBatchResult & { source: LogSource; sourceId: string }>> => {
      const startTime = Date.now();
      const startTimeStr = new Date(startTime).toISOString();
      let success = true;
      let resultData: (ParseBatchResult & { source: LogSource; sourceId: string }) | undefined;
      let error: AppError | undefined;

      const source = inputData.source ?? LogSource.JSON_FILE;
      const sourceId = inputData.sourceId ?? `src-${randomUUID()}`;

      try {
        const parseResult = parser.parseBatch(inputData.rawLogs);
        resultData = {
          ...parseResult,
          source,
          sourceId,
        };
      } catch (err: any) {
        success = false;
        error = {
          code: "LOG_PARSE_FAILED",
          message: err.message || String(err),
        };
      }

      const endTime = Date.now();
      const endTimeStr = new Date(endTime).toISOString();
      const duration = endTime - startTime;

      console.log(JSON.stringify({
        workflowId: "IncidentAnalysisWorkflow",
        stepName: "parser",
        status: success ? "success" : "failed",
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration,
      }));

      return {
        success,
        duration,
        data: resultData,
        error,
      };
    },
  });

  const validatorStep = createStep({
    id: "validator",
    inputSchema: z.any(),
    outputSchema: z.any(),
    execute: async ({ inputData }): Promise<WorkflowStepResult<ValidationBatchResult & { source: LogSource; sourceId: string; rawEntryCount: number }>> => {
      const startTime = Date.now();
      const startTimeStr = new Date(startTime).toISOString();
      let success = true;
      let resultData: (ValidationBatchResult & { source: LogSource; sourceId: string; rawEntryCount: number }) | undefined;
      let error: AppError | undefined;

      const prevResult = inputData as WorkflowStepResult<ParseBatchResult & { source: LogSource; sourceId: string }>;

      if (!prevResult.success || !prevResult.data) {
        success = false;
        error = prevResult.error ?? {
          code: "PIPELINE_STEP_FAILED",
          message: "Previous step (parser) failed or returned no data",
        };
      } else {
        try {
          const validationResult = validator.validateBatch(prevResult.data.successes);
          resultData = {
            ...validationResult,
            source: prevResult.data.source,
            sourceId: prevResult.data.sourceId,
            rawEntryCount: prevResult.data.total,
          };
        } catch (err: any) {
          success = false;
          error = {
            code: "LOG_INGESTION_FAILED",
            message: err.message || String(err),
          };
        }
      }

      const endTime = Date.now();
      const endTimeStr = new Date(endTime).toISOString();
      const duration = endTime - startTime;

      console.log(JSON.stringify({
        workflowId: "IncidentAnalysisWorkflow",
        stepName: "validator",
        status: success ? "success" : "failed",
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration,
      }));

      return {
        success,
        duration,
        data: resultData,
        error,
      };
    },
  });

  const normalizerStep = createStep({
    id: "normalizer",
    inputSchema: z.any(),
    outputSchema: z.any(),
    execute: async ({ inputData, runId, getStepResult }): Promise<WorkflowStepResult<IncidentContext>> => {
      const startTime = Date.now();
      const startTimeStr = new Date(startTime).toISOString();
      let success = true;
      let context: IncidentContext | undefined;
      let error: AppError | undefined;

      const prevResult = inputData as WorkflowStepResult<ValidationBatchResult & { source: LogSource; sourceId: string; rawEntryCount: number }>;

      if (!prevResult.success || !prevResult.data) {
        success = false;
        error = prevResult.error ?? {
          code: "PIPELINE_STEP_FAILED",
          message: "Previous step (validator) failed or returned no data",
        };
      } else {
        try {
          const normalisationResult = normalizer.normaliseBatch(prevResult.data.valid);
          const nowMs = nowEpochMs();

          const correlationId = toCorrelationId(randomUUID());
          const id = toIncidentId(randomUUID());
          const triggeringEntries: typeof normalisationResult.entries = [];

          const signal: AnomalySignal = {
            id: randomUUID(),
            type: AnomalyType.GENERIC,
            description: "Placeholder signal",
            confidence: 0,
            severity: Severity.INFO,
            detectedAt: nowMs,
            triggeringEntries,
          };

          let ctx = createIncidentContext({
            id,
            correlationId,
            runId: toRunId(runId),
            lifecycle: IncidentLifecycle.DETECTED,
            priority: severityToPriority(Severity.INFO),
            severity: Severity.INFO,
            title: "Initial Ingested Incident Context",
            signal,
            detectedAt: nowMs,
          });

          ctx = updateIncidentContext(ctx, {
            logBatch: {
              meta: {
                source: prevResult.data.source,
                sourceId: prevResult.data.sourceId,
                collectedAt: nowMs,
                rawEntryCount: prevResult.data.rawEntryCount,
              },
              entries: normalisationResult.entries,
            },
          });

          const parserResult = getStepResult<WorkflowStepResult<ParseBatchResult & { startedAt: number; completedAt: number }>>("parser");

          if (parserResult?.data?.failures) {
            for (const fail of parserResult.data.failures) {
              ctx = recordError(ctx, {
                code: "LOG_PARSE_FAILED",
                message: `Failed to parse raw entry at index ${fail.index}: ${fail.reason}`,
                context: { raw: fail.raw },
              });
            }
          }

          if (prevResult.data.invalid) {
            for (const fail of prevResult.data.invalid) {
              const issuesStr = fail.issues
                .map((i: any) => `${i.path.join(".")}: ${i.message}`)
                .join("; ");
              ctx = recordError(ctx, {
                code: "LOG_INGESTION_FAILED",
                message: `Validation failed at index ${fail.index}: ${issuesStr}`,
                context: { rawLog: fail.rawLog },
              });
            }
          }

          if (parserResult) {
            ctx = recordStep(ctx, {
              stepName: "PARSED",
              status: parserResult.success ? "DONE" : "FAILED",
              startedAt: toEpochMs(Date.now() - parserResult.duration),
              completedAt: toEpochMs(Date.now()),
              durationMs: parserResult.duration,
            });
          }

          ctx = recordStep(ctx, {
            stepName: "VALIDATION",
            status: prevResult.success ? "DONE" : "FAILED",
            startedAt: toEpochMs(Date.now() - prevResult.duration),
            completedAt: toEpochMs(Date.now()),
            durationMs: prevResult.duration,
          });

          ctx = recordStep(ctx, {
            stepName: "NORMALIZED",
            status: "DONE",
            startedAt: toEpochMs(startTime),
            completedAt: toEpochMs(Date.now()),
            durationMs: Date.now() - startTime,
          });

          context = ctx;
        } catch (err: any) {
          success = false;
          error = {
            code: "UNKNOWN_ERROR",
            message: err.message || String(err),
          };
        }
      }

      const endTime = Date.now();
      const endTimeStr = new Date(endTime).toISOString();
      const duration = endTime - startTime;

      console.log(JSON.stringify({
        workflowId: "IncidentAnalysisWorkflow",
        stepName: "normalizer",
        status: success ? "success" : "failed",
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration,
      }));

      return {
        success,
        duration,
        data: context,
        error,
      };
    },
  });

  return createWorkflow({
    id: "IncidentAnalysisWorkflow",
    inputSchema: z.object({
      rawLogs: z.array(z.any()),
      source: z.nativeEnum(LogSource).optional(),
      sourceId: z.string().optional(),
    }),
    outputSchema: z.any(),
  })
    .then(parserStep)
    .then(validatorStep)
    .then(normalizerStep)
    .commit();
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Default Instantiation
// ─────────────────────────────────────────────────────────────────────────────

export const IncidentAnalysisWorkflow = createIncidentAnalysisWorkflow({
  parser: new LogParser(),
  validator: new LogValidator(),
  normalizer: new LogNormaliser(),
});
