import React, { useEffect, useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorBanner from "../components/ui/ErrorBanner";
import RootCauseCard from "../components/analysis/RootCauseCard";
import { SeverityBadge, StatusBadge } from "../components/ui";
import RootCauseFlow from "../components/ui/RootCauseFlow";
import { Brain, Sliders, Play, Pause } from "lucide-react";

export const RootCause: React.FC = () => {
  const { currentIncident, isAnalyzing, error, retryAnalysis, generateRootCause } = useIncident();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentIncident) return;
    if (currentIncident.rootCause) return;
    
    // Check if we already have an error for this section, so we don't loop
    if (generationError) return;

    const runGeneration = async () => {
      setIsGenerating(true);
      setGenerationError(null);
      try {
        await generateRootCause();
      } catch (err: any) {
        setGenerationError(err.message || "Failed to generate Root Cause Analysis");
      } finally {
        setIsGenerating(false);
      }
    };

    runGeneration();
  }, [currentIncident]);

  const retryGeneration = async () => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      await generateRootCause();
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate Root Cause Analysis");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isAnalyzing || isGenerating) {
    return <LoadingState message="Root Cause Engine Running" subMessage="Deducing failure chain and service dependencies..." />;
  }

  if (error) {
    return <ErrorBanner code="RCA_ERROR" message={error} onRetry={retryAnalysis} />;
  }

  if (generationError) {
    return <ErrorBanner code="RCA_GENERATION_ERROR" message={generationError} onRetry={retryGeneration} />;
  }

  if (!currentIncident) {
    return <EmptyState />;
  }

  if (!currentIncident.rootCause) {
    return (
      <EmptyState
        title="RCA Diagnostic Missing"
        description="Root Cause Analysis step did not run or failed for this incident run session."
        actionText="UPLOAD NEW LOG BATCH"
      />
    );
  }

  return (
    <div className="space-y-6 font-mono text-left text-white max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
            Root Cause Diagnosis (RCA)
          </h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            AI-driven failure chain deduction and service dependency linkages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={currentIncident.incident.severity.toLowerCase() as any} />
          <StatusBadge status="danger" label={currentIncident.incident.lifecycle} />
        </div>
      </div>

      {/* Grid: Interactive Dependency Graph & Playback Controller */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-brand-neon" />
            <span className="text-text-secondary uppercase">Dependency Graph Playback:</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5 select-none">
            <button className="p-1 hover:text-white text-brand-neon cursor-pointer">
              <Play size={12} />
            </button>
            <button className="p-1 hover:text-white text-text-dim cursor-pointer">
              <Pause size={12} />
            </button>
          </div>
        </div>

        {/* Graph Visualizer */}
        <RootCauseFlow />
      </div>

      {/* Detailed Analysis Card info */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
          <Brain size={14} className="text-brand-purple" />
          RCA Telemetry Audit Report
        </h3>
        <RootCauseCard rca={currentIncident.rootCause} />
      </div>
    </div>
  );
};

export default RootCause;
