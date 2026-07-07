/**
 * src/mastra/agents/postmortem.agent.ts
 *
 * PURPOSE:
 *   Configures the Post-Mortem Generator Mastra Agent with lazy
 *   initialization. The Agent is NOT constructed at module load time;
 *   it is created on the first call to generateReport(). This prevents a
 *   crash at startup when ANTHROPIC_API_KEY is not yet configured.
 *
 * LAZY INIT CONTRACT:
 *   • If ANTHROPIC_API_KEY is absent, generateReport() throws a plain
 *     AppError-shaped object that the calling service wraps in Err(AppError).
 *   • Once the Agent is successfully created it is cached for all subsequent
 *     calls (singleton-per-process semantics preserved).
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env, requireProviderKey } from "../../config/env";
import type { IPostMortemAgent, PostMortemReport } from "../../types/postmortem";

export class MastraPostMortemAgent implements IPostMortemAgent {
  /** Lazily-constructed Agent instance. Undefined until first generateReport() call. */
  private agent: Agent | undefined;

  /**
   * Returns the Agent, constructing it on first access.
   * Throws an AppError-shaped object if ANTHROPIC_API_KEY is missing.
   */
  private getAgent(): Agent {
    if (this.agent !== undefined) return this.agent;

    const apiKey = requireProviderKey("ANTHROPIC_API_KEY", "Anthropic Claude");

    this.agent = new Agent({
      id: "postmortem-agent",
      name: "Automatic Post-Mortem Generator Agent",
      instructions:
        "You are an expert Post-Mortem Generator. Your job is to summarize the incident, its root cause, the remediation plan, and the safety validation results into a structured Post-Mortem Report. You must summarize only the provided validated information. Never invent events, timestamps, remediation actions, or root causes. If timestamps are incomplete, you must state exactly 'Incomplete timeline due to insufficient event timestamps.' in the timeline. Generate JSON only, matching the schema exactly.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
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
