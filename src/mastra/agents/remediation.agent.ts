/**
 * src/mastra/agents/remediation.agent.ts
 *
 * PURPOSE:
 *   Configures the Remediation Recommendation Mastra Agent with lazy
 *   initialization. The Agent is NOT constructed at module load time;
 *   it is created on the first call to recommend(). This prevents a crash
 *   at startup when ANTHROPIC_API_KEY is not yet configured.
 *
 * LAZY INIT CONTRACT:
 *   • If ANTHROPIC_API_KEY is absent, recommend() throws a plain AppError-shaped
 *     object that the calling service wraps in Err(AppError).
 *   • Once the Agent is successfully created it is cached for all subsequent
 *     calls (singleton-per-process semantics preserved).
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env, requireProviderKey } from "../../config/env";
import type { IRemediationAgent, RemediationPlan } from "../../types/remediation";

export class MastraRemediationAgent implements IRemediationAgent {
  /** Lazily-constructed Agent instance. Undefined until first recommend() call. */
  private agent: Agent | undefined;

  /**
   * Returns the Agent, constructing it on first access.
   * Throws an AppError-shaped object if ANTHROPIC_API_KEY is missing.
   */
  private getAgent(): Agent {
    if (this.agent !== undefined) return this.agent;

    const apiKey = requireProviderKey("ANTHROPIC_API_KEY", "Anthropic Claude");

    this.agent = new Agent({
      id: "remediation-agent",
      name: "Remediation Recommendation Agent",
      instructions:
        "You are an expert Incident Response Remediation assistant. Your goal is to recommend operational remediation actions based on the incident context and root cause analysis. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey,
      },
    });

    return this.agent;
  }

  /**
   * Run the Mastra Agent to recommend remediation steps and return the structured remediation plan.
   */
  async recommend(prompt: string): Promise<RemediationPlan> {
    const agent = this.getAgent(); // throws AppError-shape if key absent

    const result = await agent.generate(prompt, {
      structuredOutput: {
        schema: z.object({
          immediateActions: z.array(z.string()),
          longTermFixes: z.array(z.string()),
          rollbackRequired: z.boolean(),
          rollbackSteps: z.array(z.string()),
          estimatedImpact: z.string(),
          confidence: z.number(),
          prerequisites: z.array(z.string()),
          risks: z.array(z.string()),
        }),
      },
    });

    if (!result.object) {
      throw new Error("Mastra Agent failed to return a structured remediation plan object.");
    }

    return result.object;
  }
}

export const remediationAgent = new MastraRemediationAgent();
