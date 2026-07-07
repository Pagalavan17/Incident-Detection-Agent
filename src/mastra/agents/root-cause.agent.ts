/**
 * src/mastra/agents/root-cause.agent.ts
 *
 * PURPOSE:
 *   Configures and instantiates the Root Cause Analysis (RCA) Mastra Agent.
 *   Implements the decoupled IRootCauseAgent interface.
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env } from "../../config/env.ts";
import type { IRootCauseAgent, RootCauseAnalysis } from "../../types/root-cause.ts";

export class MastraRootCauseAgent implements IRootCauseAgent {
  private readonly agent: Agent;

  constructor() {
    this.agent = new Agent({
      id: "root-cause-agent",
      name: "Root Cause Analysis Agent",
      instructions:
        "You are an expert Root Cause Analysis (RCA) assistant. Your goal is to analyze incident context, triggering logs, anomaly types, severity, and similar historical incidents to identify the most probable root cause of the current incident. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey: env.ANTHROPIC_API_KEY,
      },
    });
  }

  /**
   * Run the Mastra Agent to analyze the prompt and return the structured root cause analysis.
   */
  async analyze(prompt: string): Promise<RootCauseAnalysis> {
    const result = await this.agent.generate(prompt, {
      structuredOutput: {
        schema: z.object({
          probableCause: z.string(),
          confidence: z.number(),
          evidence: z.array(z.string()),
          reasoning: z.string(),
          relatedIncidents: z.array(z.string()),
          supportingAnomalies: z.array(z.string()),
        }),
      },
    });

    if (!result.object) {
      throw new Error("Mastra Agent failed to return a structured root cause analysis object.");
    }

    return result.object;
  }
}

export const rootCauseAgent = new MastraRootCauseAgent();
