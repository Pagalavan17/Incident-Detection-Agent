import React, { useState } from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import SeverityBadge from "../components/incident/SeverityBadge";
import StatusChip from "../components/incident/StatusChip";
import AnomalyTable from "../components/incident/AnomalyTable";
import Timeline from "../components/incident/Timeline";
import HistoricalIncidentTable from "../components/incident/HistoricalIncidentTable";
import { Terminal, Activity } from "lucide-react";

export const IncidentDetails: React.FC = () => {
  const { currentIncident } = useIncident();
  const [logSearch, setLogSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const logsPerPage = 15;

  if (!currentIncident) {
    return <EmptyState />;
  }

  const { incident, anomalies, historicalMatches } = currentIncident;
  const logEntries = incident.logBatch?.entries || [];

  // Filter logs by search query
  const filteredLogs = logEntries.filter((entry) => {
    const searchLower = logSearch.toLowerCase();
    return (
      entry.message.toLowerCase().includes(searchLower) ||
      entry.service.toLowerCase().includes(searchLower) ||
      entry.host.toLowerCase().includes(searchLower) ||
      entry.severity.toLowerCase().includes(searchLower)
    );
  });

  // Paginate logs
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (
    <div className="space-y-6 font-mono text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            Incident Telemetry Center
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            Normalised logs, pipeline details, and anomaly validation scopes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={incident.severity} />
          <StatusChip status={incident.lifecycle} />
        </div>
      </div>

      {/* Incident Header Overview */}
      <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Title</span>
            <h3 className="text-sm font-bold uppercase mt-1 text-slate-800 dark:text-slate-200">
              {incident.title}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase">CORRELATION ID</span>
              <p className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 break-all mt-0.5">
                {incident.correlationId}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase">PIPELINE RUN ID</span>
              <p className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 break-all mt-0.5">
                {incident.runId}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-cyber-border-light dark:border-cyber-border-dark pt-4 md:pt-0 md:pl-6 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">DETECTION TIME</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(incident.detectedAt).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">LAST MODIFIED</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(incident.updatedAt).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">TOTAL LOG BATCH</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{logEntries.length} lines</span>
          </div>
        </div>
      </div>

      {/* Grid of Anomalies and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Fired Anomalies section */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center">
              <Activity size={14} className="mr-1.5 text-red-500" />
              Detected Anomaly Signals ({anomalies.length})
            </h3>
            <AnomalyTable anomalies={anomalies} />
          </div>
          
          {/* Historical Incident Retrieval */}
          <div>
            <HistoricalIncidentTable matches={historicalMatches} />
          </div>
        </div>

        <div className="space-y-6">
          <Timeline incidentData={currentIncident} />
        </div>
      </div>

      {/* Full Ingested/Normalised logs listing */}
      {logEntries.length > 0 && (
        <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-3">
            <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase flex items-center">
              <Terminal size={14} className="mr-1.5 text-cyber-primary" />
              Ingested Normalized Log Batch
            </h3>
            
            {/* Log Search input */}
            <input
              type="text"
              value={logSearch}
              onChange={(e) => {
                setLogSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="FILTER LOG ENTRIES..."
              className="bg-cyber-bg-light dark:bg-cyber-bg-dark border border-cyber-border-light dark:border-cyber-border-dark px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-700 focus:outline-none focus:border-cyber-primary max-w-xs"
            />
          </div>

          <div className="overflow-x-auto border border-cyber-border-light dark:border-cyber-border-dark">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-cyber-border-light dark:border-cyber-border-dark text-[10px] uppercase text-slate-500">
                  <th className="p-2 text-left font-semibold">Timestamp</th>
                  <th className="p-2 text-left font-semibold">Service</th>
                  <th className="p-2 text-left font-semibold">Host</th>
                  <th className="p-2 text-left font-semibold">Severity</th>
                  <th className="p-2 text-left font-semibold">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border-light dark:divide-cyber-border-dark">
                {currentLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300"
                  >
                    <td className="p-2 whitespace-nowrap text-[10px] text-slate-400">
                      {entry.timestampIso}
                    </td>
                    <td className="p-2 whitespace-nowrap text-[10px] font-bold text-cyber-primary">
                      {entry.service}
                    </td>
                    <td className="p-2 whitespace-nowrap text-[10px] text-slate-500">
                      {entry.host}
                    </td>
                    <td className="p-2 whitespace-nowrap text-[10px]">
                      <SeverityBadge severity={entry.severity} />
                    </td>
                    <td className="p-2 font-sans break-all max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                      {entry.message}
                    </td>
                  </tr>
                ))}
                {!currentLogs.length && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                      No logs match search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-[10px] uppercase tracking-wider text-slate-400 select-none">
              <span>
                Page {currentPage} of {totalPages} ({filteredLogs.length} total entries)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-cyber-border-light dark:border-cyber-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                >
                  PREV
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-cyber-border-light dark:border-cyber-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default IncidentDetails;
