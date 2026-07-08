import React from "react";
import HealthIndicator from "./HealthIndicator";

interface MetricCardProps {
  title: string;
  value: string | number;
  status: "ok" | "degraded" | "unconfigured";
  subText?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  status,
  subText,
  className = "",
}) => {
  return (
    <div className={`cyber-panel p-4 flex flex-col justify-between font-mono bg-cyber-panel-light dark:bg-cyber-panel-dark text-left ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider">
          {title}
        </span>
        <HealthIndicator status={status} size="sm" />
      </div>
      <div>
        <h4 className="text-xl font-bold font-mono tracking-tight text-slate-800 dark:text-slate-100">
          {value}
        </h4>
        {subText && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
            {subText}
          </span>
        )}
      </div>
    </div>
  );
};
export default MetricCard;
