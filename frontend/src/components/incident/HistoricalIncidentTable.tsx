import React from "react";
import type { SimilarIncident } from "../../api/types";
import { History, CheckCircle2 } from "lucide-react";

interface HistoricalIncidentTableProps {
  matches: readonly SimilarIncident[];
}

export const HistoricalIncidentTable: React.FC<HistoricalIncidentTableProps> = ({ matches }) => {
  if (!matches.length) {
    return (
      <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          NO RELEVANT HISTORICAL MATCHES FOUND IN VECTOR STORE
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-left">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-cyber-border-light dark:border-cyber-border-dark pb-3 mb-4">
        <History size={16} />
        <span>Qdrant Semantic Search (Top-{matches.length} Matches)</span>
      </div>

      <div className="space-y-6">
        {matches.map((match, index) => {
          const simPercentage = Math.round(match.similarity * 100);
          
          return (
            <div
              key={match.incidentId || index}
              className="border border-cyber-border-light dark:border-cyber-border-dark p-4 bg-slate-50/50 dark:bg-slate-900/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-cyber-primary uppercase">
                  INCIDENT ID: {match.incidentId.substring(0, 8)}...
                </span>
                
                {/* Similarity Score bar */}
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 uppercase">SIMILARITY:</span>
                  <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 border border-cyber-border-light dark:border-cyber-border-dark">
                    <div
                      className="bg-cyber-accent h-full shadow-[0_0_8px_#06b6d4]"
                      style={{ width: `${simPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-cyber-accent">{simPercentage}%</span>
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {/* Summary */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Incident Summary
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {match.summary}
                  </p>
                </div>

                {/* Root cause if available */}
                {match.rootCause && (
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Original Root Cause
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 font-mono bg-slate-100 dark:bg-slate-900/40 p-2 border border-cyber-border-light dark:border-cyber-border-dark text-[11px]">
                      {match.rootCause}
                    </p>
                  </div>
                )}

                {/* Remediation Actions History */}
                {match.remediations?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                      Remediation Actions Executed
                    </h4>
                    <ul className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {match.remediations.map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start space-x-1.5">
                          <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                <div className="pt-2 border-t border-cyber-border-light dark:border-cyber-border-dark flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>OCCURRENCE DATE</span>
                  <span>{new Date(match.occurredAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default HistoricalIncidentTable;
