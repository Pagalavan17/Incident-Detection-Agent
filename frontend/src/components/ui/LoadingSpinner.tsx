import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "PROBING SYSTEM AND RUNNING AI AGENTS...",
  subMessage = "This may take 15-30 seconds as root cause analysis and guardrails validations are computed.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark font-mono text-center">
      <div className="relative mb-6">
        {/* Cybersecurity grid animation */}
        <div className="absolute -inset-2 border border-cyber-primary/20 dark:border-cyber-primary/20 animate-pulse"></div>
        <div className="absolute -inset-4 border border-cyber-primary/10 dark:border-cyber-primary/10 animate-pulse delay-75"></div>
        <Loader2 className="w-10 h-10 text-cyber-primary animate-spin" />
      </div>
      <h3 className="text-sm font-bold tracking-widest text-cyber-primary uppercase mb-2">
        {message}
      </h3>
      {subMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          {subMessage}
        </p>
      )}
    </div>
  );
};
export default LoadingSpinner;
