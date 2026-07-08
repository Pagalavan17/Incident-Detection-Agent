import React from "react";
import type { Severity } from "../../api/types";

interface SeverityBadgeProps {
  severity: Severity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles: Record<Severity, string> = {
    CRITICAL: "bg-red-500/10 text-red-500 border-red-500 dark:border-red-500/50 font-bold",
    ERROR: "bg-red-500/10 text-red-500 border-red-500/30",
    WARN: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    INFO: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    DEBUG: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono tracking-wider border uppercase select-none ${styles[severity] || styles.INFO}`}
    >
      {severity}
    </span>
  );
};
export default SeverityBadge;
