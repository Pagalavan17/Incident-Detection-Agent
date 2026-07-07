/**
 * src/mastra/agents/remediation.agent.ts
 *
 * PURPOSE:
 *   Configures and instantiates the Remediation Recommendation Mastra Agent.
 *   Implements the decoupled IRemediationAgent interface.
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env } from "../../config/env.ts";
import type { IRemediationAgent, RemediationPlan } from "../../types/remediation.ts";

export class MastraRemediationAgent implements IRemediationAgent {
  private readonly agent: Agent;

  constructor() {
    this.agent = new Agent({
      id: "remediation-agent",
      name: "Remediation Recommendation Agent",
      instructions:
        "You are an expert Incident Response Remediation assistant. Your goal is to recommend operational remediation actions based on the incident context and root cause analysis. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey: env.ANTHROPIC_API_KEY,
      },
    });
  }

  /**
   * Run the Mastra Agent to recommend remediation steps and return the structured remediation plan.
   */
  async recommend(prompt: string): Promise<RemediationPlan> {
    const result = await this.agent.generate(prompt, {
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
