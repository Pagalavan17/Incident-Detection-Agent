/**
 * src/mastra/agents/guardrails.agent.ts
 *
 * PURPOSE:
 *   Configures and instantiates the Guardrails validation Mastra Agent.
 *   Implements the decoupled IGuardrailsAgent interface.
 */

import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import axios from "axios";
import { env } from "../../config/env.ts";
import type { IGuardrailsAgent, ValidationResult } from "../../types/guardrails.ts";

export class MastraGuardrailsAgent implements IGuardrailsAgent {
  private readonly agent: Agent;

  constructor() {
    this.agent = new Agent({
      id: "guardrails-agent",
      name: "Enkrypt AI Guardrails Agent",
      instructions:
        "You are Enkrypt AI Guardrails, a safety validation assistant. Your goal is to validate AI-generated Incident Response outputs (Root Cause Analysis and Remediation Plan) against the Incident Context. Adhere strictly to the requested schema. Generate only JSON, with no markdown formatting.",
      model: {
        id: `anthropic/${env.ANTHROPIC_MODEL}` as `${string}/${string}`,
        apiKey: env.ANTHROPIC_API_KEY,
      },
    });
  }

  /**
   * Run Enkrypt AI and Mastra LLM safety validation on the compiled prompt.
   */
  async validate(prompt: string): Promise<ValidationResult> {
    // 1. Verify Enkrypt AI API Key
    const apiKey = env.ENKRYPTAI_GUARDRAILS_API_KEY;
    if (!apiKey || apiKey === "your_enkryptai_api_key_here") {
      return {
        approved: false,
        riskLevel: "HIGH",
        issues: ["Enkrypt Guardrails is unavailable: API key is missing or not configured."],
        warnings: [],
        confidence: 0,
        failedChecks: ["EnkryptGuardrailsUnavailable"],
      };
    }

    let enkryptIssues: string[] = [];
    let enkryptFailedChecks: string[] = [];

    // 2. Call Enkrypt AI REST API for threat / injection / toxicity checks
    try {
      const response = await axios.post(
        "https://api.enkryptai.com/guardrails/detect",
        {
          text: prompt,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      if (response.data) {
        const data = response.data;
        if (data.is_safe === false) {
          enkryptIssues.push("Enkrypt AI safety check flagged potential security or injection risks.");
          enkryptFailedChecks.push("EnkryptSafetyViolation");
          if (data.violations) {
            for (const [key, value] of Object.entries(data.violations)) {
              if (value && typeof value === "object" && (value as { detected?: boolean }).detected) {
                enkryptIssues.push(`Enkrypt AI detected violation: ${key}`);
              }
            }
          }
        }
      }
    } catch (error: unknown) {
      // If the Enkrypt AI API call fails/errors out (e.g. 401 Unauthorized, 404, or timeout),
      // we must treat it as Enkrypt Guardrails being unavailable and return immediately.
      const message = error instanceof Error ? error.message : String(error);
      return {
        approved: false,
        riskLevel: "HIGH",
        issues: [`Enkrypt Guardrails is unavailable: API call failed. Error: ${message}`],
        warnings: [],
        confidence: 0,
        failedChecks: ["EnkryptGuardrailsUnavailable"],
      };
    }

    // 3. Delegate deep semantic validation to the Mastra LLM Agent
    try {
      const result = await this.agent.generate(prompt, {
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

      // Merge issues and failedChecks from Enkrypt API and Claude LLM
      const combinedIssues = [...enkryptIssues, ...valResult.issues];
      const combinedFailedChecks = [...enkryptFailedChecks, ...valResult.failedChecks];
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
