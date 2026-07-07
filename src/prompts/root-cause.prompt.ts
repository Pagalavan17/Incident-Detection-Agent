/**
 * src/prompts/root-cause.prompt.ts
 *
 * PURPOSE:
 *   Handles prompt building for the Root Cause Analysis (RCA) step.
 *   Keeps LLM prompt construction separated from the execution and orchestrating services.
 */

import type { IncidentContext } from "../models/IncidentContext.ts";
import type { RetrievalResult } from "../services/retrieval/retrieval.service.ts";
import type { IncidentContextWithAnomalies } from "../services/anomaly/anomaly-types.ts";

/**
 * Compiles a detailed, structured prompt for the Root Cause Analysis LLM/Agent.
 *
 * @param context - The current incident context (including anomalies and triggering logs).
 * @param retrievalResult - Semantic search matches of historical incidents.
 * @returns The fully constructed prompt string.
 */
export function buildRootCausePrompt(
  context: IncidentContext,
  retrievalResult: RetrievalResult
): string {
  // 1. Current Incident Summary & Severity
  const summary = context.title || context.signal.description || "No summary available";
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

  // 3. Current Incident Triggering Logs (Context Evidence)
  let triggeringLogsString = "No triggering logs provided.";
  const relevantLogs = context.relevantLogs || context.signal?.triggeringEntries;
  if (relevantLogs && relevantLogs.length > 0) {
    triggeringLogsString = relevantLogs
      .map(
        (log) =>
          `[${log.timestampIso || "N/A"}] [${log.severity || "N/A"}] [${log.service || "N/A"}] ${log.message}`
      )
      .join("\n");
  }

  // 4. Format Historical Incidents
  const matches = retrievalResult.matches || [];
  let historicalSection = "";
  if (matches.length > 0) {
    historicalSection = matches
      .map((match, index) => {
        const rc = match.rootCause || "N/A";
        return `--- HISTORICAL INCIDENT #${index + 1} ---
Incident ID: ${match.incidentId}
Similarity Score: ${match.similarity.toFixed(4)}
Occurred At: ${match.occurredAt}
Summary: ${match.summary}
Root Cause: ${rc}`;
      })
      .join("\n\n");
  } else {
    historicalSection = "NO SIMILAR HISTORICAL INCIDENTS FOUND IN THE DATABASE.";
  }

  // 5. Build prompt instructions
  const prompt = `You are a production-grade Incident Response Root Cause Analysis (RCA) AI assistant.
Your objective is to infer the most probable root cause of the current incident using the provided context and historical incident context.

--- CURRENT INCIDENT SUMMARY ---
Title/Description: ${summary}
Anomaly Types: ${anomalyTypesString}
Severity: ${severity}

--- CURRENT INCIDENT TRIGGERING LOGS ---
${triggeringLogsString}

--- HISTORICAL INCIDENTS (FROM QDRANT VECTOR STORE) ---
${historicalSection}

--- CRITICAL REQUIREMENTS & RULES ---
1. STRICT JSON ONLY: Your output must be a single raw JSON object matching the SCHEMA below. Do not wrap it in markdown code blocks (e.g., \`\`\`json ... \`\`\`), do not output any surrounding text.
2. NO REMEDIATION: Do not generate, propose, or include any remediation actions, plans, or suggestions.
3. NO POST-MORTEM: Do not generate any post-mortem report or post-mortem content.
4. NO LOG HALLUCINATIONS: Do not invent or hallucinate any logs, timestamps, or system outputs. Rely strictly on the triggering logs provided.
5. EXPLAIN REASONING: Thoroughly explain the logical chain of thought leading to your conclusion.
6. NO INCIDENT FABRICATION: Never invent or fabricate historical incidents.
7. EMPTY HISTORICAL INCIDENTS HANDLING:
   If no historical incidents are listed above:
   - Explain the root cause using ONLY the current incident's summary and triggering logs.
   - Set the "relatedIncidents" field to an empty array: [].
   - Explicitly state in the "reasoning" field that no similar historical incidents were found.

--- CONFIDENCE SCORING GUIDANCE ---
Assign a numeric score between 0.00 and 1.00 for the "confidence" field according to:
- 0.90–1.00: Strong evidence from both current incident and historical matches.
- 0.60–0.89: Good evidence but some uncertainty.
- 0.30–0.59: Limited evidence.
- Below 0.30: Very weak evidence.
* Never output a confidence of 1.00 unless the evidence is completely overwhelming and certain.

--- JSON SCHEMA ---
{
  "probableCause": "A clear, concise statement of the inferred most probable root cause of the incident.",
  "confidence": <number between 0.00 and 1.00 representing diagnosis certainty>,
  "evidence": [<array of specific observations, logs, or metrics from the current incident that support this root cause>],
  "reasoning": "A detailed explanation detailing the logical chain of thought leading to this conclusion, referencing similarities to historical incidents if applicable, or stating if no similar historical incidents were found.",
  "relatedIncidents": [<array of incident IDs from the historical matches that are highly relevant to this incident>],
  "supportingAnomalies": [<array of anomaly types (e.g., from "${anomalyTypesString}") that contributed to the inferred root cause>]
}`;

  return prompt;
}
