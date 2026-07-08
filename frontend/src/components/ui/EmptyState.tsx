import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Plus } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionPath?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Active Incident Session Found",
  description = "Please upload or paste system log files to initialize the incident response pipeline.",
  actionText = "UPLOAD SYSTEM LOGS",
  actionPath = "/upload",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark font-mono text-center max-w-2xl mx-auto my-10">
      <div className="p-3 bg-cyber-border-light dark:bg-cyber-border-dark text-slate-400 dark:text-slate-500 mb-4 border border-cyber-border-light dark:border-cyber-border-dark">
        <ShieldAlert size={32} />
      </div>
      <h3 className="text-base font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase mb-2">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 font-sans leading-relaxed">
        {description}
      </p>
      {actionPath && actionText && (
        <Link
          to={actionPath}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-cyber-primary hover:bg-cyber-primary/95 text-white border border-cyber-primary font-mono tracking-wider transition-all"
        >
          <Plus size={14} className="mr-1.5" />
          {actionText}
        </Link>
      )}
    </div>
  );
};
export default EmptyState;
