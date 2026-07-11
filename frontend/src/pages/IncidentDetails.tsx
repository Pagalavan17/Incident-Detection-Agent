import React, { useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorBanner from "../components/ui/ErrorBanner";
import { SeverityBadge, StatusBadge } from "../components/ui";
import AnomalyTable from "../components/incident/AnomalyTable";
import Timeline from "../components/incident/Timeline";
import HistoricalIncidentTable from "../components/incident/HistoricalIncidentTable";
import { Terminal, Activity, Download, UserPlus } from "lucide-react";
import LogViewer from "../components/ui/LogViewer";

export const IncidentDetails: React.FC = () => {
  const { currentIncident, isAnalyzing, error } = useIncident();
  const [assignee, setAssignee] = useState("Unassigned");

  if (isAnalyzing) {
    return <LoadingState message="Incident Context Loading" subMessage="Normalizing logs and aggregating telemetry..." />;
  }

  if (error) {
    return <ErrorBanner code="INCIDENT_ERROR" message={error} />;
  }

  if (!currentIncident) {
    return <EmptyState />;
  }

  const { incident, anomalies, historicalMatches } = currentIncident;
  const logEntries = incident.logBatch?.entries || [];

  const handleExportCSV = () => {
    const headers = "ID,Timestamp,Service,Host,Severity,Message\n";
    const rows = logEntries
      .map((e) => `${e.id},"${e.timestampIso}","${e.service}","${e.host}",${e.severity},"${e.message.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incident-telemetry-${incident.runId.substring(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-left text-white max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
            Incident Telemetry Center
          </h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            Normalized log streams, historical database correlations, and diagnostic events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={incident.severity.toLowerCase() as any} />
          <StatusBadge status="danger" label={incident.lifecycle} />
        </div>
      </div>

      {/* Grid: Overview Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core details board (col-span-8) */}
        <div className="lg:col-span-8 bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-5">
            <div>
              <span className="text-[8px] uppercase text-text-muted font-bold tracking-widest block">Title</span>
              <h3 className="text-sm font-bold uppercase mt-1 text-white leading-normal">
                {incident.title}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-white/2 p-3 border border-white/5 rounded-xl">
                <span className="text-[8px] font-mono text-text-muted uppercase block">Correlation Scope ID</span>
                <p className="font-mono text-[10px] font-bold text-brand-neon break-all mt-1">
                  {incident.correlationId}
                </p>
              </div>
              <div className="bg-white/2 p-3 border border-white/5 rounded-xl">
                <span className="text-[8px] font-mono text-text-muted uppercase block">Telemetry Run Session ID</span>
                <p className="font-mono text-[10px] font-bold text-brand-neon break-all mt-1">
                  {incident.runId}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons (Export, Assign Analyst) */}
          <div className="flex flex-wrap items-center justify-between border-t border-white/5 mt-6 pt-4 gap-3 text-xs font-sans">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
              <UserPlus size={13} className="text-brand-neon" />
              <span className="text-text-secondary text-[10px] font-mono uppercase">Owner:</span>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="bg-transparent border-none text-[10px] font-mono font-bold text-white focus:outline-none p-0 ml-1"
              >
                <option value="Unassigned">UNASSIGNED</option>
                <option value="John Doe">JOHN DOE (Admin)</option>
                <option value="SecOps Tier-1">SECOPS TIER-1</option>
                <option value="AI Autoremedy">AI AUTOREMEDY</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold border border-white/10 hover:border-brand-neon hover:bg-brand-neon/10 rounded-xl text-text-secondary hover:text-white transition-all font-mono uppercase cursor-pointer"
              >
                <Download size={12} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Info panel (col-span-4) */}
        <div className="lg:col-span-4 bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4 font-sans text-xs">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">
            Audit Metadata
          </h4>
          <div className="space-y-3 font-mono text-[11px]">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-text-muted uppercase">DETECTION TIME</span>
              <span className="font-bold text-white">{new Date(incident.detectedAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-text-muted uppercase">LAST MODIFIED</span>
              <span className="font-bold text-white">{new Date(incident.updatedAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted uppercase">LOG LINE COUNTS</span>
              <span className="font-bold text-white">{logEntries.length} lines</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Tables & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detected Anomalies and matches (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center">
              <Activity size={14} className="mr-1.5 text-red-500" />
              Detected Anomaly Signals ({anomalies.length})
            </h3>
            <AnomalyTable anomalies={anomalies} />
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <HistoricalIncidentTable matches={historicalMatches} />
          </div>
        </div>

        {/* Timeline (col-span-1) */}
        <div className="lg:col-span-1 bg-[#111827] border border-white/10 rounded-2xl p-6">
          <Timeline incidentData={currentIncident} />
        </div>

      </div>

      {/* Normalized Logs Stream Console */}
      {logEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-text-muted uppercase flex items-center">
            <Terminal size={14} className="mr-1.5 text-brand-neon" />
            Raw Ingested Log Telemetry Console
          </h3>
          <LogViewer logs={logEntries} />
        </div>
      )}

    </div>
  );
};

export default IncidentDetails;
