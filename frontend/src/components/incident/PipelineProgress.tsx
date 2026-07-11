import React from "react";
import type { CompleteIncidentResponse } from "../../api/types";
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";

interface PipelineProgressProps {
  incidentData: CompleteIncidentResponse;
  isAnalyzing?: boolean;
}

type StepStatus = "success" | "failed" | "skipped" | "loading";

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  incidentData,
  isAnalyzing = false,
}) => {
  // Maps a nullable field to its display status.
  // - non-null              → "success"
  // - null + isAnalyzing   → "loading"  (step is in-flight)
  // - null + !isAnalyzing  → "failed"   (backend attempted but produced no output)
  const stepStatus = (value: unknown): StepStatus => {
    if (value !== null && value !== undefined) return "success";
    return isAnalyzing ? "loading" : "failed";
  };

  const steps = [
    {
      name: "Log Ingestion & Normalisation",
      status: "success" as StepStatus,
      description: "Logs parsed and validated successfully.",
    },
    {
      name: "Anomaly Scans",
      status: "success" as StepStatus,
      description: `Rule scans completed. Detected ${incidentData.anomalies.length} anomaly signal(s).`,
    },
    {
      name: "Historical Incident Retrieval",
      status: stepStatus(incidentData.historicalMatches.length > 0 ? incidentData.historicalMatches : null),
      description: incidentData.historicalMatches.length > 0
        ? `Found ${incidentData.historicalMatches.length} semantic database match(es).`
        : isAnalyzing
        ? "Retrieving historical incidents…"
        : "Historical retrieval failed or returned no matches.",
    },
    {
      name: "Root Cause Diagnosis (RCA)",
      status: stepStatus(incidentData.rootCause),
      description: incidentData.rootCause
        ? "AI Root Cause analysis formulated."
        : isAnalyzing
        ? "Running Root Cause Analysis…"
        : "RCA generation failed.",
    },
    {
      name: "Remediation Recommendation",
      status: stepStatus(incidentData.remediation),
      description: incidentData.remediation
        ? "Operational mitigation actions generated."
        : isAnalyzing
        ? "Generating remediation recommendations…"
        : "Remediation planning failed.",
    },
    {
      name: "Guardrails Validation",
      status: stepStatus(incidentData.guardrails),
      description: incidentData.guardrails
        ? `Safety audit complete: Risk is ${incidentData.guardrails.riskLevel}.`
        : isAnalyzing
        ? "Running guardrails validation…"
        : "Guardrails check failed.",
    },
    {
      name: "Post-Mortem Drafting",
      status: stepStatus(incidentData.postMortem),
      description: incidentData.postMortem
        ? "Executive post-mortem document compiled."
        : isAnalyzing
        ? "Drafting post-mortem report…"
        : "Post-Mortem compiler failed.",
    },
  ];

  const StatusIcon: React.FC<{ status: StepStatus }> = ({ status }) => {
    if (status === "success") {
      return <CheckCircle2 size={16} className="text-emerald-500" />;
    }
    if (status === "failed") {
      return <XCircle size={16} className="text-red-500" />;
    }
    if (status === "loading") {
      return <Loader2 size={16} className="text-cyber-primary animate-spin" />;
    }
    // "skipped" — kept for forward-compat if ever needed
    return <HelpCircle size={16} className="text-slate-400 dark:text-slate-600" />;
  };

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono">
      <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase mb-6 border-b border-cyber-border-light dark:border-cyber-border-dark pb-2">
        Incident Response Pipeline Status
      </h3>
      <div className="relative border-l border-cyber-border-light dark:border-cyber-border-dark pl-6 ml-3 space-y-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Status Icon */}
            <span className="absolute -left-[37px] top-0 flex items-center justify-center bg-cyber-panel-light dark:bg-cyber-panel-dark p-1 rounded-none border border-cyber-border-light dark:border-cyber-border-dark">
              <StatusIcon status={step.status} />
            </span>
            {/* Stage Info */}
            <div className="text-left">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                {step.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PipelineProgress;
