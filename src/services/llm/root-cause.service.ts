/**
 * src/services/llm/root-cause.service.ts
 *
 * PURPOSE:
 *   Orchestrates AI-powered Root Cause Analysis (RCA) by compiling context,
 *   retrieved matches, and invoking the abstract root cause agent.
 */

import type { IRootCauseAgent, RootCauseAnalysis } from "../../types/root-cause";
import type { IncidentContext } from "../../models/IncidentContext";
import type { RetrievalResult } from "../retrieval/retrieval.service";
import { buildRootCausePrompt } from "../../prompts/root-cause.prompt";
import { rootCauseAgent } from "../../mastra/agents/root-cause.agent";
import type { Result, AppError } from "../../types/common";
import { ok, err, makeError } from "../../types/common";

export class RootCauseService {
  /**
   * Depends only on the IRootCauseAgent interface, decoupling it from concrete Mastra implementations.
   */
  constructor(private readonly rcaAgent: IRootCauseAgent) {}

  /**
   * Analyzes an incident to determine its root cause.
   *
   * @param context - Current incident context containing anomalies, logs, etc.
   * @param retrievalResult - Semantic similarity query results containing similar historical incidents.
   * @returns A promise resolving to a Result wrapping the RootCauseAnalysis.
   */
  async analyzeRootCause(
    context: IncidentContext,
    retrievalResult: RetrievalResult
  ): Promise<Result<RootCauseAnalysis, AppError>> {
    try {
      // 1. Compile prompt text
      const prompt = buildRootCausePrompt(context, retrievalResult);

      // 2. Delegate generation to the abstract agent
      const analysis = await this.rcaAgent.analyze(prompt);

      return ok(analysis);
    } catch (error: any) {
      return err(
        makeError("LLM_CALL_FAILED", error.message || String(error), {
          cause: error,
        })
      );
    }
  }
}

// Export pre-configured instance
export const rootCauseService = new RootCauseService(rootCauseAgent);
