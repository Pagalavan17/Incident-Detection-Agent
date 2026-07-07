/**
 * src/services/enkrypt/guardrails.service.ts
 *
 * PURPOSE:
 *   Orchestrates AI Guardrails validation by compiling context, root cause,
 *   remediation plan and invoking the abstract guardrails agent.
 */

import type { IGuardrailsAgent, ValidationResult } from "../../types/guardrails.ts";
import type { IncidentContext } from "../../models/IncidentContext.ts";
import type { RootCauseAnalysis } from "../../types/root-cause.ts";
import type { RemediationPlan } from "../../types/remediation.ts";
import { buildGuardrailsPrompt } from "../../prompts/guardrails.prompt.ts";
import { guardrailsAgent } from "../../mastra/agents/guardrails.agent.ts";
import type { Result, AppError } from "../../types/common.ts";
import { ok, err, makeError } from "../../types/common.ts";

export class GuardrailsService {
  /**
   * Depends on the abstract IGuardrailsAgent interface, decoupling it from concrete Mastra agent implementations.
   */
  constructor(private readonly guardrailsAgent: IGuardrailsAgent) {}

  /**
   * Validates safety of generated incident analysis outputs (Root Cause & Remediation) against incident context.
   *
   * @param context - Current incident context.
   * @param rootCause - The diagnosed RootCauseAnalysis.
   * @param remediation - The recommended RemediationPlan.
   * @returns A promise resolving to a Result wrapping the ValidationResult.
   */
  async validateOutputs(
    context: IncidentContext,
    rootCause: RootCauseAnalysis,
    remediation: RemediationPlan
  ): Promise<Result<ValidationResult, AppError>> {
    try {
      // 1. Compile prompt text
      const prompt = buildGuardrailsPrompt(context, rootCause, remediation);

      // 2. Delegate validation to the abstract guardrails agent
      const result = await this.guardrailsAgent.validate(prompt);

      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(
        makeError("ENKRYPT_VALIDATION_FAILED", message, {
          cause: error,
        })
      );
    }
  }
}

// Export pre-configured instance
export const guardrailsService = new GuardrailsService(guardrailsAgent);
