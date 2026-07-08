import React from "react";
import { Link } from "react-router-dom";
import { useIncident } from "../context/IncidentContext";
import { useHealth } from "../context/HealthContext";
import MetricCard from "../components/health/MetricCard";
import PipelineProgress from "../components/incident/PipelineProgress";
import SeverityBadge from "../components/incident/SeverityBadge";
import StatusChip from "../components/incident/StatusChip";
import { Shield, Plus, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export const Dashboard: React.FC = () => {
  const { currentIncident } = useIncident();
  const { status, services } = useHealth();

  const hasIncident = !!currentIncident;

  // Prepare chart data if anomalies exist
  const getAnomalyChartData = () => {
    if (!currentIncident?.anomalies) return [];
    const counts: Record<string, number> = {};
    currentIncident.anomalies.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ name: type, count }));
  };

  const getSeverityChartData = () => {
    if (!currentIncident?.anomalies) return [];
    const counts: Record<string, number> = {};
    currentIncident.anomalies.forEach((a) => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    const colors: Record<string, string> = {
      CRITICAL: "#ef4444",
      ERROR: "#f87171",
      WARN: "#f59e0b",
      INFO: "#3b82f6",
      DEBUG: "#94a3b8",
    };
    return Object.entries(counts).map(([severity, count]) => ({
      name: severity,
      value: count,
      fill: colors[severity] || "#3b82f6",
    }));
  };

  const anomalyData = getAnomalyChartData();
  const severityData = getSeverityChartData();

  // Find Qdrant Status
  const qdrantService = services.find((s) => s.name === "qdrant");
  const qdrantStatus = qdrantService ? qdrantService.status : "unconfigured";

  return (
    <div className="space-y-6 font-mono text-left">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            Ops Diagnostics Cockpit
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            AI-Driven Post-Ingestion Incident Response Abstractions
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-cyber-primary hover:bg-cyber-primary/95 text-white border border-cyber-primary font-mono tracking-wider transition-all"
        >
          <Plus size={14} className="mr-1.5" />
          ANALYZE NEW LOG BATCH
        </Link>
      </div>

      {/* Global Context Health / Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall API Health"
          value={status === "ok" ? "READY" : "DEGRADED"}
          status={status === "ok" ? "ok" : "degraded"}
          subText={status === "ok" ? "All services verified" : "Connection checks reporting offline nodes"}
        />
        <MetricCard
          title="Qdrant Vector Node"
          value={qdrantStatus === "ok" ? "ONLINE" : "OFFLINE"}
          status={qdrantStatus === "ok" ? "ok" : "degraded"}
          subText={qdrantService?.latencyMs ? `Latency: ${qdrantService.latencyMs} ms` : "Search engine link state"}
        />
        <MetricCard
          title="Active Run Session"
          value={hasIncident ? currentIncident.incident.lifecycle : "IDLE"}
          status={hasIncident ? "ok" : "unconfigured"}
          subText={hasIncident ? `RUN ID: ${currentIncident.incident.runId.substring(0, 8)}...` : "Awaiting logs upload"}
        />
        <MetricCard
          title="System Severity State"
          value={hasIncident ? currentIncident.incident.severity : "INFO"}
          status={hasIncident && currentIncident.incident.severity === "CRITICAL" ? "degraded" : "ok"}
          subText={hasIncident ? `Priority tier: ${currentIncident.incident.priority}` : "Normal baseline"}
        />
      </div>

      {hasIncident ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Incident Summary (Main details) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border-light dark:border-cyber-border-dark pb-3">
                <div className="flex items-center space-x-2">
                  <SeverityBadge severity={currentIncident.incident.severity} />
                  <StatusChip status={currentIncident.incident.lifecycle} />
                </div>
                <span className="text-[10px] text-slate-400">
                  DETECTED: {new Date(currentIncident.incident.detectedAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">
                  Active Incident Title
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 uppercase mt-1 leading-snug">
                  {currentIncident.incident.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-cyber-border-light dark:border-cyber-border-dark text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-1">Detected Anomalies</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentIncident.anomalies.length} Scans fired
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-1">Historical Matches</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentIncident.historicalMatches.length} Matches in DB
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-1">Correlation Scope</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 break-all">
                    {currentIncident.incident.correlationId.substring(0, 12)}...
                  </span>
                </div>
              </div>

              {/* Navigation highlights to details */}
              <div className="pt-4 flex justify-end">
                <Link
                  to="/details"
                  className="inline-flex items-center text-xs text-cyber-primary hover:text-cyber-primary-dark font-bold hover:underline"
                >
                  EXPLORE FULL INCIDENT TELEMETRY
                  <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>

            {/* AI Diagnostics Highlights (RCA, Remediation, PM Summaries) */}
            <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark text-left space-y-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase border-b border-cyber-border-light dark:border-cyber-border-dark pb-2">
                Executive Diagnostics Summaries
              </h3>
              
              <div className="space-y-4 divide-y divide-cyber-border-light dark:divide-cyber-border-dark">
                {/* RCA Summary */}
                {currentIncident.rootCause ? (
                  <div className="pt-0 pb-3">
                    <span className="text-[9px] uppercase font-bold text-red-500">Root Cause Conclusion</span>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {currentIncident.rootCause.probableCause}
                    </p>
                    <Link to="/root-cause" className="text-[10px] text-cyber-primary font-bold hover:underline block mt-1">
                      VIEW EVIDENCE & LOGS
                    </Link>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">Root cause analysis was not executed or failed.</div>
                )}

                {/* Remediation Action summary */}
                {currentIncident.remediation ? (
                  <div className="pt-3 pb-3">
                    <span className="text-[9px] uppercase font-bold text-cyber-accent">Mitigation Recommendations</span>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {currentIncident.remediation.immediateActions?.[0] || "No immediate action recommendations generated."}
                    </p>
                    <Link to="/remediation" className="text-[10px] text-cyber-primary font-bold hover:underline block mt-1">
                      VIEW FULL MITIGATION STEPS
                    </Link>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">Remediation actions were not recommended.</div>
                )}

                {/* Guardrails summary */}
                {currentIncident.guardrails ? (
                  <div className="pt-3 pb-3">
                    <span className="text-[9px] uppercase font-bold text-emerald-500">Policy Guardrails Status</span>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Safety validation status: {currentIncident.guardrails.approved ? "APPROVED (Safe)" : "REJECTED (Harmful)"} with risk rating of {currentIncident.guardrails.riskLevel}.
                    </p>
                    <Link to="/guardrails" className="text-[10px] text-cyber-primary font-bold hover:underline block mt-1">
                      VIEW COMPLIANCE POLICY CHECK
                    </Link>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">Guardrail verification was not executed.</div>
                )}

                {/* Post-Mortem summary */}
                {currentIncident.postMortem ? (
                  <div className="pt-3 pb-0">
                    <span className="text-[9px] uppercase font-bold text-purple-400">Post-Mortem Executive Summary</span>
                    <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {currentIncident.postMortem.executiveSummary}
                    </p>
                    <Link to="/post-mortem" className="text-[10px] text-cyber-primary font-bold hover:underline block mt-1">
                      READ COMPLETE INCIDENT REPORT
                    </Link>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">Post-Mortem report compiling failed or skipped.</div>
                )}
              </div>
            </div>
          </div>

          {/* Stepper progress & Chart visualization widgets */}
          <div className="space-y-6">
            <PipelineProgress incidentData={currentIncident} />

            {/* Recharts graphs */}
            {anomalyData.length > 0 && (
              <div className="cyber-panel p-4 bg-cyber-panel-light dark:bg-cyber-panel-dark text-left">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">
                  Anomaly Breakdown
                </span>
                <div className="h-48 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anomalyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "1px solid #1f2937",
                          borderRadius: "0px",
                          fontFamily: "monospace",
                          color: "#f3f4f6",
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6">
                        {anomalyData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {severityData.length > 0 && (
              <div className="cyber-panel p-4 bg-cyber-panel-light dark:bg-cyber-panel-dark text-left">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-4">
                  Severity Distribution
                </span>
                <div className="h-48 w-full flex items-center justify-center text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "1px solid #1f2937",
                          borderRadius: "0px",
                          fontFamily: "monospace",
                          color: "#f3f4f6",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 justify-center text-[9px] font-mono">
                  {severityData.map((entry) => (
                    <span key={entry.name} className="flex items-center space-x-1">
                      <span className="w-2 h-2 inline-block" style={{ backgroundColor: entry.fill }} />
                      <span>
                        {entry.name} ({entry.value})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Dashboard state */
        <div className="cyber-panel p-16 text-center space-y-6 bg-cyber-panel-light dark:bg-cyber-panel-dark max-w-3xl mx-auto my-6 border border-cyber-border-light dark:border-cyber-border-dark">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-cyber-border-light dark:border-cyber-border-dark flex items-center justify-center mx-auto text-slate-400">
            <Shield size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
              No Operational Sessions Active
            </h2>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Upload system log files using the log ingestion module to activate the diagnostics cockpit.
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold bg-cyber-primary hover:bg-cyber-primary/95 text-white border border-cyber-primary font-mono tracking-wider transition-all"
          >
            <Plus size={14} className="mr-1.5" />
            UPLOAD LOG PAYLOAD
          </Link>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
