import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncident } from "../context/IncidentContext";
import LogUploader from "../components/incident/LogUploader";
import PipelineCard from "../components/ui/PipelineCard";
import ErrorBanner from "../components/ui/ErrorBanner";
import Toast from "../components/ui/Toast";
import { motion } from "framer-motion";

export const UploadLogs: React.FC = () => {
  const { analyzeLogs, currentIncident, isAnalyzing, error } = useIncident();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogsUpload = async (logs: Record<string, unknown>[]) => {
    try {
      await analyzeLogs(logs);
      setToastMessage("SecOps response pipeline completed successfully");
      setTimeout(() => {
        navigate("/");
      }, 1500); // Allow the user to see the completed pipeline state before navigating
    } catch {
      // Errors are already handled in IncidentContext state
    }
  };

  return (
    <div className="space-y-6 font-mono text-left max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
            Log Ingestion Center
          </h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            Parse, validate, and normalize system logs for automated anomaly diagnostic runs
          </p>
        </div>
      </div>

      {error && (
        <ErrorBanner
          code="INGESTION_PIPELINE_FAILED"
          message={error}
        />
      )}

      {/* Main Grid: Form on Left, Processing Pipeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Ingestion panel */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 bg-[#111827] border border-white/10 p-6 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xs font-bold tracking-widest text-white uppercase mb-4 border-b border-white/10 pb-2">
            Ingestion Form
          </h3>
          <LogUploader onUpload={handleLogsUpload} isAnalyzing={isAnalyzing} />
        </motion.div>

        {/* Right: Pipeline tracker & schema guide */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vertical Pipeline tracking card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PipelineCard incidentData={currentIncident} isAnalyzing={isAnalyzing} />
          </motion.div>

          {/* Target Schema verification instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-sans space-y-3.5 text-text-secondary"
          >
            <h4 className="font-mono text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/5 pb-1">
              Required Schema Structure
            </h4>
            <p className="leading-relaxed text-[11px]">
              Every submitted log record must contain the core operational fields mapped to target validator specifications:
            </p>
            <ul className="list-mono text-[10px] font-mono list-disc list-inside space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/5">
              <li><strong className="text-brand-neon">level:</strong> Log severity string (e.g. CRITICAL, ERROR, WARN, INFO)</li>
              <li><strong className="text-brand-neon">message:</strong> Details of emitter fault chain</li>
              <li><strong className="text-brand-neon">service:</strong> Target microservice identifier</li>
              <li><strong className="text-brand-neon">host:</strong> Emitter host tag or server name</li>
              <li><strong className="text-brand-neon">timestamp:</strong> Event timestamp (ISO 8601)</li>
            </ul>
          </motion.div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default UploadLogs;
