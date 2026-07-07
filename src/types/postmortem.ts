/**
 * src/types/postmortem.ts
 *
 * PURPOSE:
 *   Defines the types and interfaces for the Automatic Post-Mortem Generator.
 *   This is standard pure TypeScript to decouple LLM/agent code from other layers.
 */

/**
 * Structured output of the automatic post-mortem generator.
 */
export interface PostMortemReport {
  readonly executiveSummary: string;
  readonly incidentTimeline: string[];
  readonly impactAssessment: string;
  readonly rootCauseSummary: string;
  readonly remediationSummary: string;
  readonly validationSummary: string;
  readonly lessonsLearned: string[];
  readonly actionItems: string[];
}

/**
 * Interface representing the Post-Mortem Generator agent.
 */
export interface IPostMortemAgent {
  /**
   * Generates a structured PostMortemReport using the compiled prompt.
   *
   * @param prompt - Compiled post-mortem prompt string.
   * @returns A promise resolving to the PostMortemReport object.
   */
  generateReport(prompt: string): Promise<PostMortemReport>;
}
