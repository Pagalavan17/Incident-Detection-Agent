import React from "react";
import type { RemediationPlan } from "../../api/types";
import { AlertCircle, ShieldAlert, CheckSquare, Settings } from "lucide-react";

interface RemediationCardProps {
  remediation: RemediationPlan;
}

export const RemediationCard: React.FC<RemediationCardProps> = ({ remediation }) => {
  const confidencePct = Math.round(remediation.confidence * 100);

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-left space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-6">
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-cyber-border-light dark:border-cyber-border-dark">
          <span className="text-[9px] uppercase text-slate-500">Rollback Required</span>
          <h4 className={`text-sm font-bold uppercase mt-1 ${remediation.rollbackRequired ? "text-amber-500" : "text-emerald-500"}`}>
            {remediation.rollbackRequired ? "YES" : "NO"}
          </h4>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-cyber-border-light dark:border-cyber-border-dark">
          <span className="text-[9px] uppercase text-slate-500">Plan Confidence</span>
          <h4 className="text-sm font-bold mt-1 text-cyber-primary">
            {confidencePct}%
          </h4>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-cyber-border-light dark:border-cyber-border-dark">
          <span className="text-[9px] uppercase text-slate-500">Estimated Outcome</span>
          <h4 className="text-xs font-sans mt-1 text-slate-700 dark:text-slate-300 font-medium">
            {remediation.estimatedImpact}
          </h4>
        </div>
      </div>

      {/* Immediate Mitigations */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
          <CheckSquare size={12} className="mr-1.5 text-cyber-accent" />
          Immediate Action Recommendations (Ranked)
        </h4>
        <ul className="space-y-2">
          {remediation.immediateActions?.map((action, idx) => (
            <li
              key={idx}
              className="text-xs bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 font-sans leading-relaxed text-slate-700 dark:text-slate-300 flex items-start"
            >
              <span className="font-mono text-emerald-500 font-bold mr-2">{idx + 1}.</span>
              <span>{action}</span>
            </li>
          ))}
          {!remediation.immediateActions?.length && (
            <li className="text-xs text-slate-400 italic">No immediate actions generated.</li>
          )}
        </ul>
      </div>

      {/* Rollback Details */}
      {remediation.rollbackRequired && remediation.rollbackSteps?.length > 0 && (
        <div className="space-y-3 border-l-2 border-amber-500/40 pl-4">
          <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center">
            <AlertCircle size={12} className="mr-1.5" />
            Rollback Action Checklist
          </h4>
          <ul className="space-y-2">
            {remediation.rollbackSteps.map((step, idx) => (
              <li
                key={idx}
                className="text-xs bg-amber-500/5 border border-amber-500/10 px-3 py-2 font-sans text-slate-700 dark:text-slate-300"
              >
                <span className="font-mono text-amber-500 mr-2 font-bold">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cyber-border-light dark:border-cyber-border-dark">
        {/* Prerequisites */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
            <Settings size={12} className="mr-1.5 text-slate-400" />
            Execution Prerequisites
          </h4>
          <ul className="space-y-1.5 font-sans text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
            {remediation.prerequisites?.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{item}</li>
            ))}
            {!remediation.prerequisites?.length && (
              <li className="italic text-slate-500">None declared.</li>
            )}
          </ul>
        </div>

        {/* Risks */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
            <ShieldAlert size={12} className="mr-1.5 text-red-500" />
            Potential Risks & Side Effects
          </h4>
          <ul className="space-y-1.5 font-sans text-xs text-red-700 dark:text-red-400 list-disc list-inside bg-red-500/5 p-3 border border-red-500/10">
            {remediation.risks?.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{item}</li>
            ))}
            {!remediation.risks?.length && (
              <li className="italic text-slate-500">None identified.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Long-term prevention */}
      {remediation.longTermFixes?.length > 0 && (
        <div className="pt-4 border-t border-cyber-border-light dark:border-cyber-border-dark space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Long-Term Structural Remediations
          </h4>
          <ul className="space-y-2">
            {remediation.longTermFixes.map((fix, idx) => (
              <li
                key={idx}
                className="text-xs bg-slate-50 dark:bg-slate-900/40 border border-cyber-border-light dark:border-cyber-border-dark px-4 py-2 font-sans text-slate-700 dark:text-slate-300"
              >
                <span className="font-mono text-slate-400 dark:text-slate-600 mr-2 font-bold">{idx + 1}.</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
export default RemediationCard;
