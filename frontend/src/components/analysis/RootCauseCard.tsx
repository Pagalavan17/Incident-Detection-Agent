import React from "react";
import type { RootCauseAnalysis } from "../../api/types";
import { HelpCircle, AlertTriangle, FileCode } from "lucide-react";

interface RootCauseCardProps {
  rca: RootCauseAnalysis;
}

export const RootCauseCard: React.FC<RootCauseCardProps> = ({ rca }) => {
  const confidencePct = Math.round(rca.confidence * 100);
  
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.85) return { label: "HIGH", color: "text-emerald-500", border: "border-emerald-500/30" };
    if (score >= 0.60) return { label: "MEDIUM", color: "text-amber-500", border: "border-amber-500/30" };
    return { label: "LOW (REVIEW REQUIRED)", color: "text-red-500", border: "border-red-500/30" };
  };

  const level = getConfidenceLevel(rca.confidence);

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-left space-y-6">
      {/* Header Banner */}
      <div className="border border-cyber-border-light dark:border-cyber-border-dark p-4 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
            Probable Root Cause Conclusion
          </span>
          <span className={`px-2 py-0.5 text-[9px] border font-bold uppercase ${level.border} ${level.color}`}>
            CONFIDENCE: {level.label} ({confidencePct}%)
          </span>
        </div>
        <h3 className="text-sm md:text-base font-bold text-red-600 dark:text-red-400 uppercase leading-snug">
          {rca.probableCause}
        </h3>
      </div>

      {/* Diagnostic Explanation */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Reasoning & Analytical Logic
        </h4>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed border-l-2 border-cyber-primary/40 pl-4 py-1">
          {rca.reasoning}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cyber-border-light dark:border-cyber-border-dark">
        {/* Evidence */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
            <AlertTriangle size={12} className="mr-1.5 text-amber-500" />
            Supporting Evidence Logs
          </h4>
          <ul className="space-y-2">
            {rca.evidence?.map((item, idx) => (
              <li
                key={idx}
                className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900/40 p-2 border border-cyber-border-light dark:border-cyber-border-dark break-all"
              >
                {item}
              </li>
            ))}
            {!rca.evidence?.length && (
              <li className="text-[11px] text-slate-400 dark:text-slate-600 italic">No explicit evidence lines provided.</li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          {/* Related anomalies */}
          {rca.supportingAnomalies?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                <FileCode size={12} className="mr-1.5 text-cyber-accent" />
                Contributing Anomalies
              </h4>
              <div className="flex flex-wrap gap-2">
                {rca.supportingAnomalies.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related incident IDs */}
          {rca.relatedIncidents?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                <HelpCircle size={12} className="mr-1.5 text-slate-400" />
                Linked Historical Cases
              </h4>
              <div className="flex flex-wrap gap-2">
                {rca.relatedIncidents.map((id, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-cyber-border-light dark:border-cyber-border-dark"
                  >
                    CASE #{id.substring(0, 8)}...
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default RootCauseCard;
