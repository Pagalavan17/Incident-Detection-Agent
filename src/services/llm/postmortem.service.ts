/**
 * src/services/llm/postmortem.service.ts
 *
 * PURPOSE:
 *   Orchestrates Automatic Post-Mortem Generation by compiling context,
 *   RCA, remediation plan, validation result, and invoking the abstract post-mortem agent.
 */

import type { IPostMortemAgent, PostMortemReport } from "../../types/postmortem.ts";
import type { IncidentContext } from "../../models/IncidentContext.ts";
import type { RootCauseAnalysis } from "../../types/root-cause.ts";
import type { RemediationPlan } from "../../types/remediation.ts";
import type { ValidationResult } from "../../types/guardrails.ts";
import { buildPostMortemPrompt } from "../../prompts/postmortem.prompt.ts";
import { postMortemAgent } from "../../mastra/agents/postmortem.agent.ts";
import type { Result, AppError } from "../../types/common.ts";
import { ok, err, makeError } from "../../types/common.ts";

export class PostMortemService {
  /**
   * Depends only on the IPostMortemAgent interface, decoupling it from concrete Mastra implementations.
   */
  constructor(private readonly pmAgent: IPostMortemAgent) {}

  /**
   * Generates a structured Post-Mortem report for an incident.
   *
   * @param context - Current incident context.
   * @param rca - The diagnosed RootCauseAnalysis.
   * @param remediation - The recommended RemediationPlan.
   * @param validation - The safety ValidationResult.
   * @returns A promise resolving to a Result wrapping the PostMortemReport.
   */
  async generatePostMortem(
    context: IncidentContext,
    rca: RootCauseAnalysis,
    remediation: RemediationPlan,
    validation: ValidationResult
  ): Promise<Result<PostMortemReport, AppError>> {
    try {
      // 1. Compile prompt text
      const prompt = buildPostMortemPrompt(context, rca, remediation, validation);

      // 2. Delegate generation to the abstract agent
      const report = await this.pmAgent.generateReport(prompt);

      return ok(report);
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
export const postMortemService = new PostMortemService(postMortemAgent);
