/**
 * src/services/llm/remediation.service.ts
 *
 * PURPOSE:
 *   Orchestrates AI-powered Remediation Recommendation by compiling context,
 *   root cause, and invoking the abstract remediation agent.
 */

import type { IRemediationAgent, RemediationPlan } from "../../types/remediation";
import type { IncidentContext } from "../../models/IncidentContext";
import type { RootCauseAnalysis } from "../../types/root-cause";
import { buildRemediationPrompt } from "../../prompts/remediation.prompt";
import { remediationAgent } from "../../mastra/agents/remediation.agent";
import type { Result, AppError } from "../../types/common";
import { ok, err, makeError } from "../../types/common";

export class RemediationService {
  /**
   * Depends only on the IRemediationAgent interface, decoupling it from concrete Mastra implementations.
   */
  constructor(private readonly remediationAgent: IRemediationAgent) {}

  /**
   * Generates operational remediation recommendations for the incident.
   *
   * @param context - Current incident context.
   * @param rca - The diagnosed root cause analysis.
   * @returns A promise resolving to a Result wrapping the RemediationPlan.
   */
  async recommendRemediation(
    context: IncidentContext,
    rca: RootCauseAnalysis
  ): Promise<Result<RemediationPlan, AppError>> {
    try {
      // 1. Compile prompt text
      const prompt = buildRemediationPrompt(context, rca);

      // 2. Delegate generation to the abstract agent
      const plan = await this.remediationAgent.recommend(prompt);

      return ok(plan);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(
        makeError("LLM_CALL_FAILED", message, {
          cause: error,
        })
      );
    }
  }
}

// Export pre-configured instance
export const remediationService = new RemediationService(remediationAgent);
