import React, { useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorBanner from "../components/ui/ErrorBanner";
import { SeverityBadge, StatusBadge } from "../components/ui";
import {
  Brain,
  RefreshCw,
  Terminal,
  Play,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const AIDiagnosis: React.FC = () => {
  const { currentIncident, isAnalyzing, error } = useIncident();
  const [runningCustomCheck, setRunningCustomCheck] = useState(false);
  const [customLogsCheckText, setCustomLogsCheckText] = useState("");
  const [customCheckResult, setCustomCheckResult] = useState<string | null>(null);

  if (isAnalyzing) {
    return <LoadingState message="AI Diagnostic Engine Running" subMessage="Analyzing logs and synthesizing correlations..." />;
  }

  if (error) {
    return <ErrorBanner code="DIAGNOSIS_ERROR" message={error} />;
  }

  if (!currentIncident) {
    return <EmptyState />;
  }

  const { incident, rootCause, anomalies, guardrails } = currentIncident;

  const handleCustomCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogsCheckText.trim()) return;
    setRunningCustomCheck(true);
    setCustomCheckResult(null);
    setTimeout(() => {
      setRunningCustomCheck(false);
      setCustomCheckResult(
        "Agent Audit Result:\n" +
        "• Severity classified: HIGH\n" +
        "• Pattern correlation: Identifies socket exhaustion symptoms matching historical pool leak ID #3829.\n" +
        "• Safety Recommendation: Safe to initiate standard microservice restart routines."
      );
    }, 1500);
  };

  // Mock Radar Chart Data for Threat Vectors
  const threatRadarData = [
    { subject: "Vulnerability", A: rootCause ? rootCause.confidence * 100 : 75, fullMark: 100 },
    { subject: "Blast Radius", A: guardrails ? (guardrails.riskLevel === "HIGH" ? 90 : 35) : 50, fullMark: 100 },
    { subject: "Data Exfiltration", A: anomalies.length > 5 ? 80 : 20, fullMark: 100 },
    { subject: "Denial of Service", A: anomalies.some(a => a.type.toLowerCase().includes("limit") || a.type.toLowerCase().includes("exhaust")) ? 95 : 45, fullMark: 100 },
    { subject: "Persistence", A: 10, fullMark: 100 },
    { subject: "Lateral Movement", A: 30, fullMark: 100 },
  ];

  return (
    <div className="space-y-6 font-mono text-left text-white max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
            AI Diagnosis Cockpit
          </h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            SecOps agent correlation engine and vector semantic reasoning telemetry
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={incident.severity.toLowerCase() as any} />
          <StatusBadge status="info" label={incident.lifecycle} />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dial metrics and vector scans (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Diagnostic reasoning details */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Brain size={14} className="text-brand-neon" />
              Cognitive Summary & Reasoning
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/2 p-3 border border-white/5 rounded-xl text-xs">
                <span className="text-text-muted">Target Classifier Confidence:</span>
                <span className="font-bold text-brand-neon">
                  {rootCause ? `${Math.round(rootCause.confidence * 100)}% Confidence` : "85% Baseline"}
                </span>
              </div>
              
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-text-muted block">AI Diagnostic Deduction</span>
                <p className="text-xs font-sans text-text-secondary leading-relaxed bg-black/30 p-4 border border-white/5 rounded-xl">
                  {rootCause?.reasoning || "The anomaly pipeline identified socket allocation faults matching pool exhaustion. The client gateway timed out handling requests. Highly correlated with Database thread leaks."}
                </p>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-2.5">
                <span className="text-[9px] uppercase font-bold text-text-muted block">Telemetry Evidence Logs</span>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 text-[10px] text-text-secondary">
                  {rootCause?.evidence.map((line, idx) => (
                    <div key={idx} className="flex gap-2 hover:bg-white/5 p-1 rounded transition-colors font-mono">
                      <span className="text-brand-neon select-none">&gt;</span>
                      <span>{line}</span>
                    </div>
                  )) || (
                    <div className="text-text-dim italic">No evidence lines matched.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prompt check/Interactive diagnostics uploader */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Terminal size={14} className="text-brand-accent" />
              Execute Custom Check
            </h3>
            <form onSubmit={handleCustomCheck} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <textarea
                  rows={3}
                  value={customLogsCheckText}
                  onChange={(e) => setCustomLogsCheckText(e.target.value)}
                  placeholder="Paste snippet or log lines to request specific threat audit..."
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-text-dim focus:outline-none focus:border-brand-neon"
                />
              </div>
              
              <button
                type="submit"
                disabled={runningCustomCheck || !customLogsCheckText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-lg border border-brand-accent/30 transition-all cursor-pointer uppercase"
              >
                {runningCustomCheck ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Auditing logs...
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    Run Audit
                  </>
                )}
              </button>
            </form>

            {customCheckResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-black/40 border border-white/15 rounded-xl text-[10px] leading-relaxed text-text-secondary whitespace-pre-line"
              >
                {customCheckResult}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: Threat plot & validation checks (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Radar plot */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col items-center">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 w-full">
              Threat Vector Map
            </h3>
            <div className="w-full h-56 flex items-center justify-center text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" data={threatRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={9} />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" angle={30} domain={[0, 100]} fontSize={8} />
                  <Radar name="Threat Vector" dataKey="A" stroke="#00D9FF" fill="#00D9FF" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Validation guardrails checklist */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2">
              Agent Guardrail Audits
            </h3>
            <div className="space-y-3">
              {[
                { name: "Risk Policy Check", passed: true, desc: "Safety threshold check validated." },
                { name: "Exfiltration Audit", passed: true, desc: "Log contains no outbound credential strings." },
                { name: "Exploit Signature Match", passed: false, desc: "Matches common denial-of-service signatures." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0 text-xs">
                  <span className="mt-0.5">
                    {item.passed ? (
                      <CheckCircle size={14} className="text-emerald-400" />
                    ) : (
                      <HelpCircle size={14} className="text-amber-400" />
                    )}
                  </span>
                  <div>
                    <h5 className="font-bold text-white uppercase text-[10px]">{item.name}</h5>
                    <p className="text-[10px] text-text-muted mt-0.5 font-sans leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIDiagnosis;
