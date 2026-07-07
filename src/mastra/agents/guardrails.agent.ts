/**
 * src/mastra/agents/guardrails.agent.ts
 *
 * PURPOSE:
 *   Configures the Guardrails validation Mastra Agent with lazy initialization.
 *   The Agent is NOT constructed at module load time; it is created on the
 *   first call to validate(). This prevents a crash at startup when
 *   ANTHROPIC_API_KEY or ENKRYPTAI_GUARDRAILS_API_KEY are not configured.
 *
 * VALIDATION FLOW:
 *   1. Check ENKRYPTAI_GUARDRAILS_API_KEY is present (throws AppError-shape if not).
 *   2. Check ANTHROPIC_API_KEY is present via lazy Agent construction.
 *   3. Call Enkrypt AI REST API for threat/injection/toxicity checks.
 *   4. Delegate deep semantic validation to the Mastra LLM Agent (Claude).
 *
 * LAZY INIT CONTRACT:
 *   • If either key is absent, validate() throws a plain AppError-shaped object
 *     that the calling service wraps in Err(AppError).
 *   • Once the Agent is successfully created it is cached for subsequent calls.
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import axios from "axios";
import { env, requireProviderKey } from "../../config/env";
import type { IGuardrailsAgent, ValidationResult } from "../../types/guardrails";

export class MastraGuardrailsAgent implements IGuardrailsAgent {
  /** Lazily-constructed Agent instance. Undefined until first validate() call. */
  private agent: Agent | undefined;

  /**
   * Returns the Agent, constructing it on first access.
   * Throws an AppError-shaped object if ANTHROPIC_API_KEY is missing.
   */
  private getAgent(): Agent {
    if (this.agent !== undefined) return this.agent;

    const apiKey = requireProviderKey("ANTHROPIC_API_KEY", "Anthropic Claude");

    this.agent = new Agent({
      id: "guardrails-agent",
      name: "Enkrypt AI Guardrails Agent",
      instructions:
        "You are Enkrypt AI Guardrails, a safety validation assistant. Your goal is to validate AI-generated Incident Response outputs (Root Cause Analysis and Remediation Plan) against the Incident Context. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey,
      },
    });

    return this.agent;
  }

  /**
   * Run Enkrypt AI and Mastra LLM safety validation on the compiled prompt.
   *
   * Throws an AppError-shaped object if either API key is absent.
   * The calling service (GuardrailsService) catches this and wraps it in Err().
   */
  async validate(prompt: string): Promise<ValidationResult> {
    // 1. Assert Enkrypt key is present (throws AppError-shape if not).
    const enkryptKey = requireProviderKey(
      "ENKRYPTAI_GUARDRAILS_API_KEY",
      "Enkrypt AI Guardrails"
    );

    // 2. Assert Anthropic key is present and build/return the cached Agent.
    const agent = this.getAgent();

    let enkryptIssues: string[] = [];
    let enkryptFailedChecks: string[] = [];

    // 3. Call Enkrypt AI REST API for threat / injection / toxicity checks.
    try {
      const response = await axios.post(
        "https://api.enkryptai.com/guardrails/detect",
        { text: prompt },
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": enkryptKey,
          },
          timeout: 10_000,
        }
      );

      if (response.data) {
        const data = response.data;
        if (data.is_safe === false) {
          enkryptIssues.push(
            "Enkrypt AI safety check flagged potential security or injection risks."
          );
          enkryptFailedChecks.push("EnkryptSafetyViolation");
          if (data.violations) {
            for (const [key, value] of Object.entries(data.violations)) {
              if (
                value &&
                typeof value === "object" &&
                (value as { detected?: boolean }).detected
              ) {
                enkryptIssues.push(`Enkrypt AI detected violation: ${key}`);
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      // Enkrypt API call failed (401, 404, timeout, network error).
      // Treat as service unavailable and surface as a guardrails issue
      // rather than aborting the entire pipeline.
      const message = error instanceof Error ? error.message : String(error);
      return {
        approved: false,
        riskLevel: "HIGH",
        issues: [
          `Enkrypt Guardrails is unavailable: API call failed. Error: ${message}`,
        ],
        warnings: [],
        confidence: 0,
        failedChecks: ["EnkryptGuardrailsUnavailable"],
      };
    }

    // 4. Delegate deep semantic validation to the Mastra LLM Agent.
    try {
      const result = await agent.generate(prompt, {
        structuredOutput: {
          schema: z.object({
            approved: z.boolean(),
            riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
            issues: z.array(z.string()),
            warnings: z.array(z.string()),
            confidence: z.number(),
            failedChecks: z.array(z.string()),
          }),
        },
      });

      if (!result.object) {
        throw new Error("Mastra Agent failed to return a structured validation result.");
      }

      const valResult = result.object;

      // Merge issues from Enkrypt REST API and Claude LLM.
      const combinedIssues = [...enkryptIssues, ...valResult.issues];
      const combinedFailedChecks = [
        ...enkryptFailedChecks,
        ...valResult.failedChecks,
      ];
      const isApproved = valResult.approved && combinedIssues.length === 0;

      return {
        approved: isApproved,
        riskLevel: combinedIssues.length > 0 ? "HIGH" : valResult.riskLevel,
        issues: combinedIssues,
        warnings: valResult.warnings,
        confidence: valResult.confidence,
        failedChecks: combinedFailedChecks,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Mastra Agent validation failed: ${message}`);
    }
  }
}

export const guardrailsAgent = new MastraGuardrailsAgent();
