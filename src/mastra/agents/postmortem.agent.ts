/**
 * src/mastra/agents/postmortem.agent.ts
 *
 * PURPOSE:
 *   Configures the Post-Mortem Generator Mastra Agent with lazy
 *   initialization. The Agent is NOT constructed at module load time;
 *   it is created on the first call to generate(). This prevents a crash
 *   at startup when the active provider's key is not yet configured.
 *   This agent uses whichever provider is configured via LLM_PROVIDER.
 *
 * LAZY INIT CONTRACT:
 *   • If the active provider's key is absent, generate() throws a plain AppError-shaped object that the calling service wraps in Err(AppError).
 *   • Once the Agent is successfully created it is cached for all subsequent
 *     calls (singleton-per-process semantics preserved).
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { resolveActiveLLM } from "../../config/env";
import type { IPostMortemAgent, PostMortemReport } from "../../types/postmortem";

export class MastraPostMortemAgent implements IPostMortemAgent {
  /** Lazily-constructed Agent instance. Undefined until first generateReport() call. */
  private agent: Agent | undefined;

  /**
   * Returns the Agent, constructing it on first access.
   * Throws an AppError-shaped object if the selected provider's key is missing.
   */
  private getAgent(): Agent {
    if (this.agent !== undefined) return this.agent;

    const { id, apiKey } = resolveActiveLLM(); // throws AppError-shape if selected provider's key is absent

    this.agent = new Agent({
      id: "postmortem-agent",
      name: "Incident Post-Mortem Agent",
      instructions:
        "You are an expert SRE tasked with writing a comprehensive Blameless Post-Mortem. Synthesize the context, root cause, and remediation steps into a professional executive summary, a detailed chronological timeline, and concrete action items for preventative maintenance. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id,
        apiKey,
      },
    });

    return this.agent;
  }

  /**
   * Run the Mastra Agent to generate a post-mortem report and return the structured report.
   */
  async generateReport(prompt: string): Promise<PostMortemReport> {
    const agent = this.getAgent(); // throws AppError-shape if key absent

    const result = await agent.generate(prompt, {
      structuredOutput: {
        schema: z.object({
          executiveSummary: z.string(),
          incidentTimeline: z.array(z.string()),
          impactAssessment: z.string(),
          rootCauseSummary: z.string(),
          remediationSummary: z.string(),
          validationSummary: z.string(),
          lessonsLearned: z.array(z.string()),
          actionItems: z.array(z.string()),
        }),
      },
    });

    if (!result.object) {
      throw new Error("Mastra Agent failed to return a structured post-mortem report object.");
    }

    return result.object;
  }
}

export const postMortemAgent = new MastraPostMortemAgent();
