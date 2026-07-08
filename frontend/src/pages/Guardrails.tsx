import React from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import GuardrailsCard from "../components/analysis/GuardrailsCard";
import SeverityBadge from "../components/incident/SeverityBadge";
import StatusChip from "../components/incident/StatusChip";

export const Guardrails: React.FC = () => {
  const { currentIncident } = useIncident();

  if (!currentIncident) {
    return <EmptyState />;
  }

  const guardrailsData = currentIncident.guardrails;

  if (!guardrailsData) {
    return (
      <EmptyState
        title="Guardrails Policy Audits Missing"
        description="Guardrails validation step was not executed or failed for this incident session."
        actionText="UPLOAD NEW LOG BATCH"
      />
    );
  }

  return (
    <div className="space-y-6 font-mono text-left max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            AI Policy Guardrails
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            Enkrypt AI safety audits, risk levels, and policy checking lists
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={currentIncident.incident.severity} />
          <StatusChip status={currentIncident.incident.lifecycle} />
        </div>
      </div>

      <GuardrailsCard validation={guardrailsData} />
    </div>
  );
};
export default Guardrails;
