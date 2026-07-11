import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Analyzing Telemetry...",
  subMessage = "AI agents are processing the incident context.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#070B14] border border-white/10 rounded-2xl font-mono text-center max-w-2xl mx-auto my-10">
      <div className="p-4 bg-brand-primary/10 text-brand-neon mb-6 rounded-full border border-brand-primary/30 relative">
        <div className="absolute inset-0 rounded-full animate-ping bg-brand-primary/20" />
        <Loader2 size={36} className="animate-spin relative z-10" />
      </div>
      <h3 className="text-lg font-bold tracking-widest text-white uppercase mb-2">
        {message}
      </h3>
      <p className="text-xs text-text-muted max-w-sm font-sans leading-relaxed">
        {subMessage}
      </p>
    </div>
  );
};

export default LoadingState;
