/**
 * src/types/remediation.ts
 *
 * PURPOSE:
 *   Defines the structures and interfaces for Remediation Recommendation.
 *   Enables decoupling between LLM/Agent implementation and service orchestration layers.
 */

/**
 * Structured output of the LLM remediation recommendation step.
 */
export interface RemediationPlan {
  /** Immediate operational steps to mitigate the issue and restore service. */
  readonly immediateActions: string[];

  /** Long-term operational recommendations to prevent recurrence. */
  readonly longTermFixes: string[];

  /** True if a rollback of a service, configuration, or deployment is required. */
  readonly rollbackRequired: boolean;

  /** Operational instructions to execute a rollback, or an empty array if rollbackRequired is false. */
  readonly rollbackSteps: string[];

  /** Expected outcome and impact of applying these remediation steps. */
  readonly estimatedImpact: string;

  /** Confidence score [0.0 - 1.0] representing operational recommendation certainty. */
  readonly confidence: number;

  /** What must be true or completed before these actions are executed. */
  readonly prerequisites: string[];

  /** Potential side-effects, risks, or risks of implementing these actions. */
  readonly risks: string[];
}

/**
 * Decoupled interface for the Remediation Recommendation agent.
 */
export interface IRemediationAgent {
  /**
   * Recommends operational remediation actions for a given compiled prompt.
   *
   * @param prompt - The full compiled prompt string.
   * @returns A promise resolving to the structured RemediationPlan object.
   */
  recommend(prompt: string): Promise<RemediationPlan>;
}
