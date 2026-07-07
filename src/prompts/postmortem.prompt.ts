/**
 * src/prompts/postmortem.prompt.ts
 *
 * PURPOSE:
 *   Handles prompt building for the Automatic Post-Mortem Generator step.
 *   Keeps LLM prompt construction separated from the execution and orchestrating services.
 */

import type { IncidentContext } from "../models/IncidentContext";
import type { RootCauseAnalysis } from "../types/root-cause";
import type { RemediationPlan } from "../types/remediation";
import type { ValidationResult } from "../types/guardrails";

/**
 * Compiles a detailed, structured prompt for the Post-Mortem Generator LLM/Agent.
 *
 * @param context - The current incident context.
 * @param rca - The diagnosed RootCauseAnalysis.
 * @param plan - The proposed RemediationPlan.
 * @param validation - The safety ValidationResult.
 * @returns The fully constructed prompt string.
 */
export function buildPostMortemPrompt(
  context: IncidentContext,
  rca: RootCauseAnalysis,
  plan: RemediationPlan,
  validation: ValidationResult
): string {
  // Format timestamps
  const detectedAtStr = context.detectedAt ? new Date(context.detectedAt).toISOString() : "UNKNOWN";
  const resolvedAtStr = context.resolvedAt ? new Date(context.resolvedAt).toISOString() : "UNKNOWN";

  // Format triggering entries/logs
  let logsString = "None";
  const relevantLogs = context.relevantLogs || context.signal?.triggeringEntries;
  if (relevantLogs && relevantLogs.length > 0) {
    logsString = relevantLogs
      .map((entry) => {
        const timestamp = entry.timestampIso || (entry.timestamp ? new Date(entry.timestamp).toISOString() : "UNKNOWN");
        return `[${timestamp}] [${entry.severity || "UNKNOWN"}] [${entry.service || "UNKNOWN"}] ${entry.message}`;
      })
      .join("\n");
  }

  // Format RCA details
  const rcaEvidence = rca.evidence && rca.evidence.length > 0
    ? rca.evidence.join("\n- ")
    : "None";
  const rcaSupportingAnomalies = rca.supportingAnomalies && rca.supportingAnomalies.length > 0
    ? rca.supportingAnomalies.join("\n- ")
    : "None";

  // Format Remediation details
  const immediateActions = plan.immediateActions && plan.immediateActions.length > 0
    ? plan.immediateActions.join("\n- ")
    : "None";
  const longTermFixes = plan.longTermFixes && plan.longTermFixes.length > 0
    ? plan.longTermFixes.join("\n- ")
    : "None";
  const rollbackSteps = plan.rollbackSteps && plan.rollbackSteps.length > 0
    ? plan.rollbackSteps.join("\n- ")
    : "None";
  const prerequisites = plan.prerequisites && plan.prerequisites.length > 0
    ? plan.prerequisites.join("\n- ")
    : "None";
  const risks = plan.risks && plan.risks.length > 0
    ? plan.risks.join("\n- ")
    : "None";

  // Format Validation details
  const validationIssues = validation.issues && validation.issues.length > 0
    ? validation.issues.join("\n- ")
    : "None";
  const validationWarnings = validation.warnings && validation.warnings.length > 0
    ? validation.warnings.join("\n- ")
    : "None";
  const failedChecks = validation.failedChecks && validation.failedChecks.length > 0
    ? validation.failedChecks.join("\n- ")
    : "None";

  return `You are a production-grade Automatic Post-Mortem Generator. Your task is to summarize the incident, its root cause, the remediation plan, and the safety validation results into a structured Post-Mortem Report.

--- INPUTS ---

1. INCIDENT CONTEXT:
- Title: ${context.title || "No title available"}
- Incident ID: ${context.id}
- Correlation ID: ${context.correlationId}
- Severity: ${context.severity || "UNKNOWN"}
- Priority: ${context.priority || "UNKNOWN"}
- Detected At: ${detectedAtStr}
- Resolved At: ${resolvedAtStr}
- Triggering Logs & Events:
${logsString}

2. DIAGNOSED ROOT CAUSE ANALYSIS (RCA):
- Probable Cause: ${rca.probableCause || "UNKNOWN"}
- Evidence:
- ${rcaEvidence}
- Reasoning: ${rca.reasoning || "No reasoning available."}
- RCA Confidence Score: ${rca.confidence !== undefined ? rca.confidence.toFixed(2) : "UNKNOWN"}
- Supporting Anomalies:
- ${rcaSupportingAnomalies}

3. PROPOSED REMEDIATION PLAN:
- Immediate Actions:
- ${immediateActions}
- Long-Term Fixes:
- ${longTermFixes}
- Rollback Required: ${plan.rollbackRequired !== undefined ? plan.rollbackRequired : false}
- Rollback Steps:
- ${rollbackSteps}
- Confidence Score: ${plan.confidence !== undefined ? plan.confidence.toFixed(2) : "UNKNOWN"}
- Prerequisites:
- ${prerequisites}
- Risks:
- ${risks}
- Estimated Impact: ${plan.estimatedImpact || "No estimated impact available."}

4. GUARDRAILS VALIDATION RESULT:
- Approved: ${validation.approved}
- Risk Level: ${validation.riskLevel || "UNKNOWN"}
- Issues Found:
- ${validationIssues}
- Warnings:
- ${validationWarnings}
- Failed Checks:
- ${failedChecks}
- Validation Confidence Score: ${validation.confidence !== undefined ? validation.confidence.toFixed(2) : "UNKNOWN"}

--- CRITICAL RULES & CONSTRAINTS ---

1. NEVER INVENT EVENTS: Do not fabricate or inject any incident event that is not present in the logs or context.
2. NEVER INVENT TIMESTAMPS: Do not create any timestamps out of thin air. Rely only on the timestamps provided in the context and logs.
3. NEVER INVENT ROOT CAUSES: Summarize the root cause analysis output exactly. Do not diagnose new root causes or alter the existing one.
4. NEVER INVENT REMEDIATION: Summarize the proposed remediation plan exactly. Do not propose new mitigation steps, fixes, or rollbacks.
5. NEVER IGNORE VALIDATION FAILURES: If the validation result "Approved" is false:
   - In the "validationSummary", explicitly state that the recommendations failed validation and include the validation issues/warnings/failed checks.
6. INCOMPLETE TIMELINE RULE: If the timeline events/timestamps are incomplete or insufficient, the "incidentTimeline" array must consist of exactly one string element:
   "Incomplete timeline due to insufficient event timestamps."
7. STRICT JSON ONLY: Your output must be a single raw JSON object matching the SCHEMA below. Do not wrap it in markdown code blocks (e.g., \`\`\`json ... \`\`\`), and do not output any surrounding text.

--- JSON SCHEMA ---
{
  "executiveSummary": <string summarizing the incident, its root cause, and remediation>,
  "incidentTimeline": [<array of strings describing key events in chronological order, or the incomplete timeline message if applicable>],
  "impactAssessment": <string summarizing the operational, system, and user impact of the incident>,
  "rootCauseSummary": <string summarizing the diagnosed root cause and supporting evidence>,
  "remediationSummary": <string summarizing immediate actions taken, long-term fixes, and any rollback procedures>,
  "validationSummary": <string summarizing the guardrail validation outcome (must include approval status, risk level, warnings, and failed checks)>,
  "lessonsLearned": [<array of strings representing key takeaways from the incident response>],
  "actionItems": [<array of strings listing follow-up tasks to prevent recurrence>]
}`;
}
