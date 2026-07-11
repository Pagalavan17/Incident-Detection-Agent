import React, { useEffect, useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorBanner from "../components/ui/ErrorBanner";
import RemediationCard from "../components/analysis/RemediationCard";
import { SeverityBadge, StatusBadge } from "../components/ui";
import {
  Terminal,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
export const Remediation: React.FC = () => {
  const { currentIncident, isAnalyzing, error, retryAnalysis, generateRemediation } = useIncident();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentIncident) return;
    if (currentIncident.remediation) return;

    const runGeneration = async () => {
      setIsGenerating(true);
      setGenerationError(null);

      try {
        await generateRemediation();
      } catch (err: any) {
        console.error("Automatic Generation Error:", err);

        setGenerationError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to generate Remediation Plan"
        );
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
      await generateRemediation();
    } catch (err: any) {
      console.error("Retry Generation Error:", err);
      setGenerationError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate Remediation Plan"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isAnalyzing || isGenerating) {
    return <LoadingState message="Remediation Engine Running" subMessage="Generating mitigation plans and runbooks..." />;
  }

  if (error) {
    return <ErrorBanner code="REMEDIATION_ERROR" message={error} onRetry={retryAnalysis} />;
  }

  if (generationError) {
    return (
      <ErrorBanner
        code="REMEDIATION_GENERATION_ERROR"
        message={generationError}
        onRetry={retryGeneration}
      />
    );
  }

  if (!currentIncident) {
    return <EmptyState />;
  }

  const remediationData = currentIncident.remediation;

  if (!remediationData) {
    return (
      <EmptyState
        title="Remediation Plan Missing"
        description="Remediation planning step was not executed or failed for this incident session."
        actionText="UPLOAD NEW LOG BATCH"
      />
    );
  }

  const commands = [
    { label: "Rolling Restart Payment Pods", cmd: "kubectl rollout restart deployment/payment-service -n production" },
    { label: "Terminate Orphan RDS Sockets", cmd: "psql -U postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';\"" },
    { label: "Scale Ingress Rate Limiter", cmd: "kubectl scale deployment/api-gateway --replicas=5" }
  ];

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };
  return (
    <div className="space-y-6 font-mono text-left text-white max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
            Remediation Center
          </h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            Interactive deployment mitigation runbooks and threat containment commands
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={currentIncident.incident.severity.toLowerCase() as any} />
          <StatusBadge status="success" label={currentIncident.incident.lifecycle} />
        </div>
      </div>

      {/* Grid: Terminal Actions & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Terminal copy commands (col-span-5) */}
        <div className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 flex items-center gap-2">
            <Terminal size={14} className="text-brand-neon" />
            Remediation Terminal Cli
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {commands.map((c, idx) => (
              <div key={idx} className="bg-black/50 p-3.5 border border-white/5 rounded-xl space-y-2 relative group">
                <span className="text-[9px] text-text-muted uppercase block font-bold tracking-wider">{c.label}</span>
                <p className="text-text-secondary select-all break-all pr-8 leading-normal text-[11px]">
                  {c.cmd}
                </p>
                <button
                  onClick={() => handleCopy(c.cmd)}
                  className="absolute right-3.5 bottom-3.5 p-1.5 hover:bg-white/10 border border-white/5 hover:border-brand-neon rounded text-text-secondary hover:text-white transition-all cursor-pointer"
                >
                  {copiedCmd === c.cmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Card layout & weights (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Wrapper */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-purple" />
              AI Remediation Recommendations
            </h3>

            <RemediationCard remediation={remediationData} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Remediation;
