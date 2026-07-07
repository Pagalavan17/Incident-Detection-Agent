/**
 * src/prompts/remediation.prompt.ts
 *
 * PURPOSE:
 *   Handles prompt building for the Remediation Recommendation step.
 *   Keeps LLM prompt construction separated from the execution and orchestrating services.
 */

import type { IncidentContext } from "../models/IncidentContext.ts";
import type { RootCauseAnalysis } from "../types/root-cause.ts";
import type { IncidentContextWithAnomalies } from "../services/anomaly/anomaly-types.ts";

/**
 * Compiles a detailed, structured prompt for the Remediation Recommendation LLM/Agent.
 *
 * @param context - The current incident context.
 * @param rca - The diagnosed RootCauseAnalysis results.
 * @returns The fully constructed prompt string.
 */
export function buildRemediationPrompt(
  context: IncidentContext,
  rca: RootCauseAnalysis
): string {
  // 1. Current Incident Summary & Severity
  const summary = context.title || context.signal?.description || "No summary available";
  const severity = context.severity || "UNKNOWN";

  // 2. Extrapolate Current Anomaly Types
  const anomalyTypesSet = new Set<string>();
  if (context.signal?.type) {
    anomalyTypesSet.add(context.signal.type);
  }
  const contextWithAnomalies = context as IncidentContextWithAnomalies;
  if (contextWithAnomalies.anomalies) {
    for (const anomaly of contextWithAnomalies.anomalies) {
      if (anomaly.type) {
        anomalyTypesSet.add(anomaly.type);
      }
    }
  }
  const anomalyTypes = Array.from(anomalyTypesSet);
  const anomalyTypesString = anomalyTypes.length > 0 ? anomalyTypes.join(", ") : "UNKNOWN";

  // 3. Root Cause details
  const rootCause = rca.probableCause || "UNKNOWN";
  const rootCauseReasoning = rca.reasoning || "No reasoning available.";
  const supportingAnomalies = rca.supportingAnomalies && rca.supportingAnomalies.length > 0
    ? rca.supportingAnomalies.join(", ")
    : "None";

  // 4. Build prompt instructions
  const prompt = `You are a production-grade Incident Response Remediation Recommendation AI assistant.
Your objective is to recommend operational remediation actions based on the current incident details and the diagnosed root cause.

--- CURRENT INCIDENT DETAILS ---
Title/Description: ${summary}
Severity: ${severity}
Anomalies: ${anomalyTypesString}

--- DIAGNOSED ROOT CAUSE ---
Root Cause: ${rootCause}
Root Cause Reasoning: ${rootCauseReasoning}
Supporting Anomalies: ${supportingAnomalies}

--- CRITICAL REQUIREMENTS & RULES ---
1. STRICT JSON ONLY: Your output must be a single raw JSON object matching the SCHEMA below. Do not wrap it in markdown code blocks (e.g., \`\`\`json ... \`\`\`), do not output any surrounding text.
2. OPERATIONAL RECOMMENDATIONS ONLY: Recommend only operational actions (e.g., restarting services, scaling resources, rolling back deployments, adjusting configurations).
3. NO ROOT CAUSE ANALYSIS GENERATION: Do not perform root cause analysis again. Treat the provided root cause as ground truth.
4. NO POST-MORTEM: Do not generate any post-mortem report or post-mortem content.
5. NO FABRICATED INFRASTRUCTURE: Recommend actions only for components, services, or deployment details implied by the incident logs and context. Do not invent unrelated infrastructure components.
6. NO DESTRUCTIVE ACTIONS: Never recommend destructive actions (database deletion, wiping data, disabling authentication, disabling security controls, deleting production resources, etc.) unless they are explicitly supported by the incident evidence.
7. LEAST DISRUPTIVE FIRST: Prefer the least disruptive operational action first when defining immediate actions.
8. CLEAR ACTION SEPARATION: Clearly distinguish temporary mitigation/immediate actions (to restore service now) from long-term fixes/permanent fixes (preventative improvements).
9. ROLLBACK STEPS HANDLING:
   - If rollbackRequired is true, "rollbackSteps" must contain clear, step-by-step operational rollback instructions.
   - If rollbackRequired is false, "rollbackSteps" must be an empty array: [].
10. PREREQUISITES & RISKS:
    - Include operational prerequisites before recommending actions.
    - Explain operational risks or potential side-effects for each recommended action.
11. PRACTICALITY: Keep all recommendations practical, actionable, and production-safe.

--- CONFIDENCE SCORING GUIDANCE ---
Assign a numeric score between 0.00 and 1.00 for the "confidence" field according to:
- 0.90–1.00: Strong operational recommendation supported by the incident evidence.
- 0.60–0.89: Reasonable recommendation with moderate confidence.
- 0.30–0.59: Recommendation contains assumptions or limited evidence.
- Below 0.30: High uncertainty in remediation effectiveness.
* Never output a confidence of 1.00 unless the recommendation is strongly supported by the available evidence.

--- JSON SCHEMA ---
{
  "immediateActions": [<array of strings containing immediate operational steps to mitigate the issue>],
  "longTermFixes": [<array of strings containing long-term operational recommendations to prevent recurrence>],
  "rollbackRequired": <boolean indicating if a rollback of a service, configuration, or deployment is necessary>,
  "rollbackSteps": [<array of strings detailing the operational rollback instructions, or empty array if rollbackRequired is false>],
  "estimatedImpact": "A string describing the expected outcome and impact of applying these remediation steps",
  "confidence": <number between 0.00 and 1.00 representing operational confidence>,
  "prerequisites": [<array of strings containing what is required before implementing these actions>],
  "risks": [<array of strings detailing potential risks or side-effects of implementing these actions>]
}`;

  return prompt;
}
