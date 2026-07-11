import React from "react";
import type { ValidationResult } from "../../api/types";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

interface GuardrailsCardProps {
  validation: ValidationResult;
}

export const GuardrailsCard: React.FC<GuardrailsCardProps> = ({ validation }) => {
  const confidencePct = Math.round((validation?.confidence || 0) * 100);

  const riskStyles = {
    LOW: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    HIGH: "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse font-bold",
  };

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-left space-y-6">
      {/* Policy Verification Indicator */}
      <div className={`p-4 border flex items-start space-x-3 ${
        validation?.approved
          ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-400"
          : "bg-red-500/5 border-red-500/30 text-red-800 dark:text-red-400"
      }`}>
        <div className="p-1">
          {validation?.approved ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {validation?.approved ? "AI POLICY VALIDATION PASSED" : "AI POLICY VALIDATION REJECTED"}
          </h3>
          <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {validation?.approved
              ? "The generated mitigation plan complies with all safety policies and infrastructure restrictions."
              : "Safety validation triggered critical policy exceptions. Human intervention required before applying fixes."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Risk Assessment */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-cyber-border-light dark:border-cyber-border-dark">
          <span className="text-[9px] uppercase text-slate-500">Security Risk Rating</span>
          <div className="mt-2">
            <span className={`px-2 py-0.5 text-xs font-bold uppercase ${riskStyles[validation?.riskLevel || "MEDIUM"]}`}>
              {validation?.riskLevel || "MEDIUM"} RISK
            </span>
          </div>
        </div>

        {/* Validation Certainty */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-cyber-border-light dark:border-cyber-border-dark">
          <span className="text-[9px] uppercase text-slate-500">Validation Certainty</span>
          <h4 className="text-sm font-bold mt-2 text-cyber-primary">
            {confidencePct}%
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cyber-border-light dark:border-cyber-border-dark">
        {/* Failed Checks */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
            <ShieldAlert size={12} className="mr-1.5 text-red-500" />
            Exceptions / Policy Violations ({validation?.failedChecks?.length || 0})
          </h4>
          <ul className="space-y-2">
            {validation?.failedChecks?.map((check, idx) => (
              <li
                key={idx}
                className="text-[11px] bg-red-500/5 text-red-700 dark:text-red-400 border border-red-500/10 p-2 break-all"
              >
                [VIOLATION] // {check}
              </li>
            ))}
            {!validation?.failedChecks?.length && (
              <li className="text-xs text-slate-400 dark:text-slate-500 italic">No policies violated.</li>
            )}
          </ul>
        </div>

        {/* Detailed Issues & warnings */}
        <div className="space-y-4">
          {validation?.issues && validation.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Exceptions Summary
              </h4>
              <ul className="space-y-1 text-xs font-sans text-slate-600 dark:text-slate-400 list-disc list-inside">
                {validation.issues.map((issue, idx) => (
                  <li key={idx} className="leading-relaxed">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validation?.warnings && validation.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                <AlertTriangle size={12} className="mr-1.5 text-amber-500" />
                Operational Warnings
              </h4>
              <ul className="space-y-1 text-xs font-sans text-slate-600 dark:text-slate-400 list-disc list-inside bg-amber-500/5 p-3 border border-amber-500/10 text-amber-800 dark:text-amber-400">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="leading-relaxed">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GuardrailsCard;
