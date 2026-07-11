import React, { useEffect, useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorBanner from "../components/ui/ErrorBanner";
import GuardrailsCard from "../components/analysis/GuardrailsCard";
import SeverityBadge from "../components/incident/SeverityBadge";
import StatusChip from "../components/incident/StatusChip";

export const Guardrails: React.FC = () => {
  const { currentIncident, isAnalyzing, error, retryAnalysis, generateGuardrails } = useIncident();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentIncident) return;
    if (currentIncident.guardrails) return;
    
    // Check if we already have an error for this section, so we don't loop
    if (generationError) return;

    const runGeneration = async () => {
      setIsGenerating(true);
      setGenerationError(null);
      try {
        await generateGuardrails();
      } catch (err: any) {
        setGenerationError(err.message || "Failed to generate Guardrails Analysis");
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
      await generateGuardrails();
    } catch (err: any) {
      setGenerationError(err.message || "Failed to generate Guardrails Analysis");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isAnalyzing || isGenerating) {
    return <LoadingState message="Policy Engine Running" subMessage="Validating mitigations against safety guardrails..." />;
  }

  if (error) {
    return <ErrorBanner code="GUARDRAILS_ERROR" message={error} onRetry={retryAnalysis} />;
  }

  if (generationError) {
    return <ErrorBanner code="GUARDRAILS_GENERATION_ERROR" message={generationError} onRetry={retryGeneration} />;
  }

  if (!currentIncident) {
    return <EmptyState />;
  }

  const guardrailsData = currentIncident.guardrails;

  if (!guardrailsData) {
    return (
      <EmptyState
        title="Guardrails Policy Audits Missing"
        description="Guardrails validation step was not executed or failed for this incident session."
        actionText="UPLOAD NEW LOG BATCH"
      />
    );
  }

  return (
    <div className="space-y-6 font-mono text-left max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            AI Policy Guardrails
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            Enkrypt AI safety audits, risk levels, and policy checking lists
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={currentIncident.incident.severity} />
          <StatusChip status={currentIncident.incident.lifecycle} />
        </div>
      </div>

      <GuardrailsCard validation={guardrailsData} />
    </div>
  );
};
export default Guardrails;
