/**
 * src/mastra/agents/postmortem.agent.ts
 *
 * PURPOSE:
 *   Configures and instantiates the Post-Mortem validation Mastra Agent.
 *   Implements the decoupled IPostMortemAgent interface.
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { env } from "../../config/env.ts";
import type { IPostMortemAgent, PostMortemReport } from "../../types/postmortem.ts";

export class MastraPostMortemAgent implements IPostMortemAgent {
  private readonly agent: Agent;

  constructor() {
    this.agent = new Agent({
      id: "postmortem-agent",
      name: "Automatic Post-Mortem Generator Agent",
      instructions:
        "You are an expert Post-Mortem Generator. Your job is to summarize the incident, its root cause, the remediation plan, and the safety validation results into a structured Post-Mortem Report. You must summarize only the provided validated information. Never invent events, timestamps, remediation actions, or root causes. If timestamps are incomplete, you must state exactly 'Incomplete timeline due to insufficient event timestamps.' in the timeline. Generate JSON only, matching the schema exactly.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey: env.ANTHROPIC_API_KEY,
      },
    });
  }

  /**
   * Run the Mastra Agent to generate a post-mortem report and return the structured report.
   */
  async generateReport(prompt: string): Promise<PostMortemReport> {
    const result = await this.agent.generate(prompt, {
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
