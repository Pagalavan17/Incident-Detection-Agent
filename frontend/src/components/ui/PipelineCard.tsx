import React from "react";
import { motion } from "framer-motion";
import {
  Hourglass,
  FileCode,
  ShieldCheck,
  Zap,
  FileText,
  Activity,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CompleteIncidentResponse } from "../../api/types";

interface PipelineCardProps {
  incidentData?: CompleteIncidentResponse | null;
  isAnalyzing: boolean;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  incidentData,
  isAnalyzing,
}) => {
  const hasData = !!incidentData;

  const steps = [
    {
      name: "Waiting",
      status: hasData || isAnalyzing ? "success" : "pending",
      label: "Payload queue trigger",
      time: hasData ? new Date(incidentData.incident.detectedAt - 12000).toLocaleTimeString() : undefined,
      icon: Hourglass,
    },
    {
      name: "Parse",
      status: hasData ? "success" : isAnalyzing ? "loading" : "pending",
      label: "Deconstruct JSON/JSONL stream",
      time: hasData ? new Date(incidentData.incident.detectedAt - 8000).toLocaleTimeString() : undefined,
      icon: FileCode,
    },
    {
      name: "Validate",
      status: hasData ? "success" : isAnalyzing ? "loading" : "pending",
      label: "Schema structure check",
      time: hasData ? new Date(incidentData.incident.detectedAt - 5000).toLocaleTimeString() : undefined,
      icon: ShieldCheck,
    },
    {
      name: "Normalize",
      status: hasData ? "success" : isAnalyzing ? "loading" : "pending",
      label: "Map fields to target standard",
      time: hasData ? new Date(incidentData.incident.detectedAt - 2000).toLocaleTimeString() : undefined,
      icon: Activity,
    },
    {
      name: "AI Analysis",
      status: hasData && incidentData.rootCause ? "success" : isAnalyzing ? "loading" : "pending",
      label: "Vector match & root cause inference",
      time: hasData && incidentData.rootCause ? new Date(incidentData.incident.detectedAt).toLocaleTimeString() : undefined,
      icon: Zap,
    },
    {
      name: "Generate Report",
      status: hasData && incidentData.postMortem ? "success" : isAnalyzing ? "loading" : "pending",
      label: "Compile executive runbook draft",
      time: hasData && incidentData.postMortem ? new Date(incidentData.incident.updatedAt).toLocaleTimeString() : undefined,
      icon: FileText,
    },
  ];

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-glow relative overflow-hidden text-left font-mono">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />
        Ingestion Processing Pipeline
      </h3>

      <div className="relative border-l-2 border-white/5 pl-8 ml-4 space-y-6">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isSuccess = step.status === "success";
          const isLoading = step.status === "loading";

          return (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {/* Connector node indicator dot */}
              <span className={`absolute -left-[43px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                isSuccess
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : isLoading
                  ? "bg-brand-primary/20 border-brand-primary text-brand-neon"
                  : "bg-white/5 border-white/10 text-text-dim"
              }`}>
                {isSuccess ? (
                  <CheckCircle2 size={12} />
                ) : isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <StepIcon size={12} />
                )}
              </span>

              {/* Step info block */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${
                    isSuccess ? "text-white" : isLoading ? "text-brand-neon" : "text-text-muted"
                  }`}>
                    {step.name}
                  </h4>
                  {step.time && (
                    <span className="text-[10px] text-text-dim bg-white/5 px-2 py-0.5 rounded">
                      {step.time}
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-[9px] text-brand-neon bg-brand-primary/20 border border-brand-primary/30 px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                      PROCESSING
                    </span>
                  )}
                  {step.status === "pending" && !isAnalyzing && (
                    <span className="text-[9px] text-text-dim bg-white/5 border border-white/5 px-2 py-0.5 rounded uppercase">
                      WAITING
                    </span>
                  )}
                  {isSuccess && (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                      COMPLETE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">
                  {step.label}
                </p>
              </div>

              {/* Progress bar line connection indicator */}
              {isLoading && (
                <div className="absolute -left-[32px] -bottom-[22px] w-0.5 h-[22px] bg-gradient-to-b from-brand-primary to-transparent animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineCard;
