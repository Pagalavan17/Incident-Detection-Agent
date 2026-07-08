import React from "react";

interface HealthIndicatorProps {
  status: "ok" | "degraded" | "unconfigured";
  size?: "sm" | "md" | "lg";
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ status, size = "md" }) => {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
  };

  const colors = {
    ok: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
    degraded: "bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse",
    unconfigured: "bg-slate-400 dark:bg-slate-600",
  };

  return (
    <div className="flex items-center">
      <div className={`${dotSizes[size]} ${colors[status]} rounded-full`} />
    </div>
  );
};
export default HealthIndicator;
