/**
 * src/prompts/guardrails.prompt.ts
 *
 * PURPOSE:
 *   Handles prompt building for the AI Guardrails validation step.
 *   Keeps LLM prompt construction separated from the execution and orchestrating services.
 */

import type { IncidentContext } from "../models/IncidentContext";
import type { RootCauseAnalysis } from "../types/root-cause";
import type { RemediationPlan } from "../types/remediation";

/**
 * Compiles a detailed, structured prompt for the AI Guardrails validation agent.
 * The agent evaluates the incident context, root cause, and remediation plan
 * against safety, accuracy, and security policies.
 *
 * @param context - The current incident context.
 * @param rca - The diagnosed RootCauseAnalysis.
 * @param plan - The proposed RemediationPlan.
 * @returns The fully constructed prompt string.
 */
export function buildGuardrailsPrompt(
  context: IncidentContext,
  rca: RootCauseAnalysis,
  plan: RemediationPlan
): string {
  // Extract Incident Context details
  const contextTitle = context.title || "No title available";
  const contextSeverity = context.severity || "UNKNOWN";
  const contextPriority = context.priority || "UNKNOWN";
  const signalDesc = context.signal?.description || "No description available";

  // Triggering logs formatting
  let logsString = "None";
  if (context.signal?.triggeringEntries && context.signal.triggeringEntries.length > 0) {
    logsString = context.signal.triggeringEntries
      .map((entry) => {
        const timestamp = entry.timestamp ? new Date(entry.timestamp).toISOString() : "UNKNOWN";
        const severity = entry.severity || "UNKNOWN";
        const message = entry.message || "";
        const service = entry.service ? `[service=${entry.service}]` : "";
        return `[${timestamp}] [${severity}] ${service} ${message}`;
      })
      .join("\n");
  }

  // Root Cause details
  const rcaCause = rca.probableCause || "UNKNOWN";
  const rcaReasoning = rca.reasoning || "No reasoning available.";
  const rcaConfidence = rca.confidence !== undefined ? rca.confidence.toFixed(2) : "UNKNOWN";
  const rcaEvidence = rca.evidence && rca.evidence.length > 0
    ? rca.evidence.join("\n- ")
    : "None";

  // Remediation Plan details
  const immediateActions = plan.immediateActions && plan.immediateActions.length > 0
    ? plan.immediateActions.join("\n- ")
    : "None";
  const longTermFixes = plan.longTermFixes && plan.longTermFixes.length > 0
    ? plan.longTermFixes.join("\n- ")
    : "None";
  const rollbackRequired = plan.rollbackRequired !== undefined ? plan.rollbackRequired : false;
  const rollbackSteps = plan.rollbackSteps && plan.rollbackSteps.length > 0
    ? plan.rollbackSteps.join("\n- ")
    : "None";
  const planConfidence = plan.confidence !== undefined ? plan.confidence.toFixed(2) : "UNKNOWN";
  const prerequisites = plan.prerequisites && plan.prerequisites.length > 0
    ? plan.prerequisites.join("\n- ")
    : "None";
  const risks = plan.risks && plan.risks.length > 0
    ? plan.risks.join("\n- ")
    : "None";
  const estimatedImpact = plan.estimatedImpact || "No estimated impact available.";

  return `You are a production-grade AI Guardrails Validation assistant. Your goal is to validate AI-generated incident response outputs (Root Cause Analysis and Remediation Plan) against the Incident Context before presenting them to the operator.

--- CURRENT INCIDENT CONTEXT ---
Title: ${contextTitle}
Severity: ${contextSeverity}
Priority: ${contextPriority}
Anomaly Signal: ${signalDesc}
Triggering Logs:
${logsString}

--- DIAGNOSED ROOT CAUSE ---
Probable Cause: ${rcaCause}
Reasoning: ${rcaReasoning}
RCA Confidence Score: ${rcaConfidence}
Evidence Identified:
- ${rcaEvidence}

--- PROPOSED REMEDIATION PLAN ---
Immediate Actions:
- ${immediateActions}
Long-Term Fixes:
- ${longTermFixes}
Rollback Required: ${rollbackRequired}
Rollback Steps:
- ${rollbackSteps}
Remediation Confidence Score: ${planConfidence}
Prerequisites:
- ${prerequisites}
Risks & Side Effects:
- ${risks}
Estimated Impact: ${estimatedImpact}

--- VALIDATION POLICY CHECKLIST & FAILURE IDENTIFIERS ---
Evaluate the inputs against the following 8 checks. If a check fails, you must list its exact failure identifier in the "failedChecks" array and add a detailed explanation to the "issues" array.

1. Evidence Consistency (Failure Identifier: "EvidenceInconsistency")
   - Verify that the diagnosed root cause and recommended actions logically align with the triggering logs and anomaly signal.
   - Fail this check if the root cause ignores critical evidence in the logs or proposes actions completely unrelated to the active errors.

2. Unsupported Claims (Failure Identifier: "UnsupportedClaim")
   - Verify that the RCA reasoning is strictly supported by the log data and anomaly signal.
   - Fail this check if the analysis makes factual claims about system behavior or failures that cannot be corroborated by the logs or context.

3. Hallucinated Infrastructure (Failure Identifier: "HallucinatedInfrastructure")
   - Ensure the remediation plan only refers to infrastructure, servers, services, repositories, or databases mentioned or directly implied in the incident logs/context.
   - Fail this check if the plan invents new service names, non-existent endpoints, or third-party tools not part of the active context.

4. Unsafe Remediation (Failure Identifier: "UnsafeRemediation")
   - Ensure recommendations do not introduce unacceptable risks, service degradation, or security weaknesses without clear prerequisites and risk assessments.
   - Fail this check if high-risk commands are recommended without warnings, or if immediate actions could worsen the outage.

5. Destructive Recommendations (Failure Identifier: "DestructiveRecommendation")
   - Ensure the plan NEVER recommends destructive operations (e.g., deleting database volumes, clearing production tables, formatting disks, dropping indexes, wiping logs, disabling security rules) unless there is clear and absolute evidence in the context validating it.
   - Fail this check if any destructive action is proposed without strict, explicit safety guards.

6. Security Policy Violations (Failure Identifier: "SecurityPolicyViolation")
   - Ensure the remediation does not violate basic security hygiene (e.g., hardcoding passwords/keys, running commands as root without sudo, opening public HTTP ports, disabling SSL validation, disabling auth).
   - Fail this check if any security policy violation is found.

7. Rollback Guidance (Failure Identifier: "RollbackGuidanceViolation")
   - If "rollbackRequired" is true, the plan must include actionable, concrete rollback steps. If "rollbackRequired" is false, the rollback steps should be empty.
   - Fail this check if rollback steps are missing when required, or present when not required.

8. Confidence Score Consistency (Failure Identifier: "ConfidenceInconsistency")
   - Verify that the confidence scores of the RCA and Remediation Plan are realistic and consistent with the completeness of the logs and the severity of the incident.
   - Fail this check if the LLM claims high confidence (e.g., 0.90+) on highly ambiguous, sparse, or conflicting log evidence.

--- OUTPUT CONSTRAINTS ---
- STRICT JSON ONLY: Your output must be a single raw JSON object matching the SCHEMA below. Do not wrap it in markdown code blocks (e.g., \`\`\`json ... \`\`\`), do not output any surrounding text.
- NO NEW REMEDIATION GENERATION: Do not generate or propose any new remediation steps. Your job is only to validate.
- NO ROOT CAUSE GENERATION: Do not generate or perform root cause analysis.
- NO POST-MORTEM GENERATION: Do not generate any postmortem or postmortem content.

--- JSON SCHEMA ---
{
  "approved": <boolean indicating if the outputs are safe and approved to present to the operator>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "issues": [<array of strings explaining each failed guardrail check and policy violation>],
  "warnings": [<array of strings describing minor issues, safety notes, or feedback that does not block approval>],
  "confidence": <number between 0.00 and 1.00 representing your safety validation confidence>,
  "failedChecks": [<array of strings containing the exact failure identifiers of all failed checks>]
}`;
}
