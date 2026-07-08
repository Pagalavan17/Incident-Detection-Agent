import React, { useState } from "react";
import type { AnomalySignal } from "../../api/types";
import SeverityBadge from "./SeverityBadge";
import { ChevronDown, ChevronUp, AlertCircle, Terminal } from "lucide-react";

interface AnomalyTableProps {
  anomalies: readonly AnomalySignal[];
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({ anomalies }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (!anomalies.length) {
    return (
      <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          NO ANOMALIES DETECTED IN LOG PAYLOAD
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left font-mono">
      {anomalies.map((anomaly) => {
        const isExpanded = expandedId === anomaly.id;
        const confidencePct = Math.round(anomaly.confidence * 100);
        
        return (
          <div
            key={anomaly.id}
            className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark"
          >
            {/* Header Accordion Bar */}
            <div
              onClick={() => toggleExpand(anomaly.id)}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all select-none"
            >
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary mt-0.5">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {anomaly.type} SIGNAL
                    </span>
                    <SeverityBadge severity={anomaly.severity} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {anomaly.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-6 text-xs border-t md:border-t-0 border-cyber-border-light dark:border-cyber-border-dark pt-2 md:pt-0">
                <div className="flex flex-col text-left md:text-right">
                  <span className="text-[9px] text-slate-400 uppercase">CONFIDENCE</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {confidencePct}%
                  </span>
                </div>
                <div className="flex flex-col text-left md:text-right">
                  <span className="text-[9px] text-slate-400 uppercase">DETECTED AT</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {new Date(anomaly.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-400 dark:text-slate-600 pl-2">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>

            {/* Collapsible Triggering Logs Panel */}
            {isExpanded && (
              <div className="border-t border-cyber-border-light dark:border-cyber-border-dark bg-slate-50/50 dark:bg-slate-900/10 p-4">
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-3">
                  <Terminal size={12} />
                  <span>Triggering Log Records ({anomaly.triggeringEntries?.length || 0})</span>
                </div>
                <div className="overflow-x-auto border border-cyber-border-light dark:border-cyber-border-dark">
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-cyber-border-light dark:border-cyber-border-dark text-[10px] uppercase text-slate-500">
                        <th className="p-2 text-left font-semibold">Time</th>
                        <th className="p-2 text-left font-semibold">Service</th>
                        <th className="p-2 text-left font-semibold">Host</th>
                        <th className="p-2 text-left font-semibold">Severity</th>
                        <th className="p-2 text-left font-semibold">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border-light dark:divide-cyber-border-dark">
                      {anomaly.triggeringEntries?.map((entry) => (
                        <tr
                          key={entry.id}
                          className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300"
                        >
                          <td className="p-2 whitespace-nowrap text-[10px]">
                            {entry.timestampIso || new Date(entry.timestamp).toISOString()}
                          </td>
                          <td className="p-2 whitespace-nowrap text-[10px] font-bold text-cyber-primary">
                            {entry.service}
                          </td>
                          <td className="p-2 whitespace-nowrap text-[10px] text-slate-500">
                            {entry.host}
                          </td>
                          <td className="p-2 whitespace-nowrap text-[10px]">
                            <SeverityBadge severity={entry.severity} />
                          </td>
                          <td className="p-2 font-sans break-all max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                            {entry.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default AnomalyTable;
