/**
 * src/types/root-cause.ts
 *
 * PURPOSE:
 *   Defines the structures and interfaces for Root Cause Analysis (RCA).
 *   Enables decoupling between LLM/Agent implementation and service orchestration layers.
 */

/**
 * Structured output of the LLM root cause analysis step.
 */
export interface RootCauseAnalysis {
  /** A clear, concise statement of the inferred most probable root cause of the incident. */
  readonly probableCause: string;

  /** Confidence score [0.0 – 1.0] representing diagnosis certainty. */
  readonly confidence: number;

  /** Specific observations, logs, or metrics from the current incident that support this root cause. */
  readonly evidence: string[];

  /** A detailed explanation detailing the logical chain of thought leading to this conclusion. */
  readonly reasoning: string;

  /** Incident IDs from similar historical incidents that are highly relevant to this incident. */
  readonly relatedIncidents: string[];

  /** List of anomaly types that contributed to the inferred root cause. */
  readonly supportingAnomalies: string[];
}

/**
 * Decoupled interface for the Root Cause Analysis agent.
 */
export interface IRootCauseAgent {
  /**
   * Generates a structured Root Cause Analysis for a given formatted prompt.
   *
   * @param prompt - The full compiled prompt string.
   * @returns A promise resolving to the structured RootCauseAnalysis object.
   */
  analyze(prompt: string): Promise<RootCauseAnalysis>;
}
