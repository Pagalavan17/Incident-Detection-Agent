import React from "react";
import type { IncidentLifecycle } from "../../api/types";

interface StatusChipProps {
  status: IncidentLifecycle;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const styles: Record<IncidentLifecycle, string> = {
    DETECTED: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    TRIAGING: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    ANALYSING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    REMEDIATING: "bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse",
    VALIDATED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    RESOLVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/30 font-bold",
    CLOSED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono tracking-wider border uppercase select-none ${styles[status] || styles.DETECTED}`}
    >
      {status}
    </span>
  );
};
export default StatusChip;
