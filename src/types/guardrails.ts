/**
 * src/types/guardrails.ts
 *
 * PURPOSE:
 *   Defines the types and interfaces for AI Guardrails validation.
 *   This is standard pure TypeScript to decouple LLM/agent code from other layers.
 */

/**
 * Structured output of the AI guardrails validation step.
 */
export interface ValidationResult {
  /** True if the AI outputs are deemed safe and correct to present to the operator. */
  readonly approved: boolean;

  /** The overall safety risk level. */
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";

  /** Detailed descriptions of any policy violations, safety issues or errors found. */
  readonly issues: string[];

  /** Warnings or minor notes regarding outputs that require attention but do not fail validation. */
  readonly warnings: string[];

  /** Numeric confidence score [0.0 - 1.0] representing validation certainty. */
  readonly confidence: number;

  /** Identifiers of specific guardrail checks that failed (e.g. HallucinatedInfrastructure). */
  readonly failedChecks: string[];
}

/**
 * Interface representing the Guardrails validation agent.
 */
export interface IGuardrailsAgent {
  /**
   * Validates compiled incident data against guardrails.
   *
   * @param prompt - Compiled guardrails prompt string.
   * @returns A promise resolving to the ValidationResult object.
   */
  validate(prompt: string): Promise<ValidationResult>;
}
