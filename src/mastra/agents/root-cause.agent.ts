/**
 * src/mastra/agents/root-cause.agent.ts
 *
 * PURPOSE:
 *   Configures the Root Cause Analysis (RCA) Mastra Agent with lazy
 *   initialization. The Agent is NOT constructed at module load time;
 *   it is created on the first call to analyze(). This prevents a crash
 *   at startup when ANTHROPIC_API_KEY is not yet configured.
 *
 * LAZY INIT CONTRACT:
 *   • If ANTHROPIC_API_KEY is absent, analyze() throws a plain AppError-shaped
 *     object that the calling service wraps in Err(AppError).
 *   • Once the Agent is successfully created it is cached for all subsequent
 *     calls (singleton-per-process semantics preserved).
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env, requireProviderKey } from "../../config/env";
import type { IRootCauseAgent, RootCauseAnalysis } from "../../types/root-cause";

export class MastraRootCauseAgent implements IRootCauseAgent {
  /** Lazily-constructed Agent instance. Undefined until first analyze() call. */
  private agent: Agent | undefined;

  /**
   * Returns the Agent, constructing it on first access.
   * Throws an AppError-shaped object if ANTHROPIC_API_KEY is missing.
   */
  private getAgent(): Agent {
    if (this.agent !== undefined) return this.agent;

    // requireProviderKey throws AppError-shaped object if key is absent.
    const apiKey = requireProviderKey("ANTHROPIC_API_KEY", "Anthropic Claude");

    this.agent = new Agent({
      id: "root-cause-agent",
      name: "Root Cause Analysis Agent",
      instructions:
        "You are an expert Root Cause Analysis (RCA) assistant. Your goal is to analyze incident context, triggering logs, anomaly types, severity, and similar historical incidents to identify the most probable root cause of the current incident. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey,
      },
    });

    return this.agent;
  }

  /**
   * Run the Mastra Agent to analyze the prompt and return the structured root cause analysis.
   */
  async analyze(prompt: string): Promise<RootCauseAnalysis> {
    const agent = this.getAgent(); // throws AppError-shape if key absent

    const result = await agent.generate(prompt, {
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
