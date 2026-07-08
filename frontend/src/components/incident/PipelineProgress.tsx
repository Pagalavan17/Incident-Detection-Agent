import React from "react";
import type { CompleteIncidentResponse } from "../../api/types";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface PipelineProgressProps {
  incidentData: CompleteIncidentResponse;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ incidentData }) => {
  const steps = [
    {
      name: "Log Ingestion & Normalisation",
      status: "success",
      description: "Logs parsed and validated successfully.",
    },
    {
      name: "Anomaly Scans",
      status: "success",
      description: `Rule scans completed. Detected ${incidentData.anomalies.length} anomaly signal(s).`,
    },
    {
      name: "Historical Incident Retrieval",
      status: incidentData.historicalMatches ? "success" : "skipped",
      description: `Found ${incidentData.historicalMatches.length} semantic database match(es).`,
    },
    {
      name: "Root Cause Diagnosis (RCA)",
      status: incidentData.rootCause ? "success" : "skipped",
      description: incidentData.rootCause
        ? "AI Root Cause analysis formulated."
        : "RCA generation failed or skipped.",
    },
    {
      name: "Remediation Recommendation",
      status: incidentData.remediation ? "success" : "skipped",
      description: incidentData.remediation
        ? "Operational mitigation actions generated."
        : "Remediation planning failed or skipped.",
    },
    {
      name: "Guardrails Validation",
      status: incidentData.guardrails ? "success" : "skipped",
      description: incidentData.guardrails
        ? `Safety audit complete: Risk is ${incidentData.guardrails.riskLevel}.`
        : "Guardrails check failed or skipped.",
    },
    {
      name: "Post-Mortem Drafting",
      status: incidentData.postMortem ? "success" : "skipped",
      description: incidentData.postMortem
        ? "Executive post-mortem document compiled."
        : "Post-Mortem compiler failed or skipped.",
    },
  ];

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
              {step.status === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : step.status === "failed" ? (
                <XCircle size={16} className="text-red-500" />
              ) : (
                <HelpCircle size={16} className="text-slate-400 dark:text-slate-600" />
              )}
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
