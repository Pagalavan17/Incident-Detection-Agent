import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncident } from "../context/IncidentContext";
import LogUploader from "../components/incident/LogUploader";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import Toast from "../components/ui/Toast";

export const UploadLogs: React.FC = () => {
  const { analyzeLogs, isAnalyzing, error } = useIncident();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogsUpload = async (logs: Record<string, unknown>[]) => {
    try {
      await analyzeLogs(logs);
      setToastMessage("Pipeline analysis completed successfully");
      // Short timeout to let the user see the success toast before navigation
      setTimeout(() => {
        navigate("/details");
      }, 1000);
    } catch {
      // Errors are already handled in IncidentContext state
    }
  };

  return (
    <div className="space-y-6 font-mono text-left max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
          Log Ingestion Module
        </h1>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
          Parse, validate, and normalize system logs for anomaly diagnostic runs
        </p>
      </div>

      {isAnalyzing ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {error && (
            <ErrorBanner
              code="INGESTION_FAILED"
              message={error}
            />
          )}

          <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark">
            <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase mb-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-2">
              Ingestion Form
            </h3>
            <LogUploader onUpload={handleLogsUpload} isAnalyzing={isAnalyzing} />
          </div>

          <div className="cyber-panel p-6 bg-slate-50 dark:bg-slate-900/10 text-xs font-sans space-y-4 border border-cyber-border-light dark:border-cyber-border-dark text-slate-600 dark:text-slate-400">
            <h4 className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Required Schema Structure
            </h4>
            <p className="leading-relaxed">
              Every JSON log object submitted must contain at least the core infrastructure fields required by the validator schema:
            </p>
            <ul className="list-mono text-[11px] font-mono list-disc list-inside space-y-1 bg-slate-100 dark:bg-slate-900/40 p-3 border border-cyber-border-light dark:border-cyber-border-dark">
              <li><strong className="text-cyber-primary">level:</strong> Log severity string (e.g. ERROR, WARN, INFO)</li>
              <li><strong className="text-cyber-primary">message:</strong> Description message body text</li>
              <li><strong className="text-cyber-primary">service:</strong> Origin emitter microservice identifier</li>
              <li><strong className="text-cyber-primary">host:</strong> Deployment container or node host tag</li>
              <li><strong className="text-cyber-primary">timestamp:</strong> Emitter time string (ISO 8601)</li>
            </ul>
          </div>
        </div>
      )}

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
