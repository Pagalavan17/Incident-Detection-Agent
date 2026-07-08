import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import MetricCard from "../components/health/MetricCard";
import HealthIndicator from "../components/health/HealthIndicator";
import { Activity, ShieldX, RefreshCw } from "lucide-react";

export const SystemHealth: React.FC = () => {
  const { status, services, lastChecked, error, refreshHealth } = useHealth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHealth();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getStatusLabel = (svcStatus: "ok" | "degraded" | "unconfigured") => {
    if (svcStatus === "ok") return "HEALTHY";
    if (svcStatus === "degraded") return "DEGRADED";
    return "UNCONFIGURED";
  };

  return (
    <div className="space-y-6 font-mono text-left max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            System Connectivity Status
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            Realtime connection diagnostics for vector databases and AI endpoints
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-cyber-border-light dark:border-cyber-border-dark cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          FORCE HEALTH AUDIT
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 flex items-start space-x-2 text-xs">
          <ShieldX size={16} className="mt-0.5 flex-shrink-0" />
          <span>Error pinging API gateway liveness endpoint: {error}</span>
        </div>
      )}

      {/* Primary Connectivity Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="HTTP Ingestion API Status"
          value={status === "ok" ? "HEALTHY" : "DEGRADED"}
          status={status === "ok" ? "ok" : "degraded"}
          subText="Endpoint connectivity validated"
        />
        <MetricCard
          title="Last Health Refresh"
          value={new Date(lastChecked || Date.now()).toLocaleTimeString()}
          status="ok"
          subText="Periodic check loops: 30s"
        />
        <MetricCard
          title="Active Integrations"
          value={`${services.filter((s) => s.status === "ok").length} / ${services.length}`}
          status={status === "ok" ? "ok" : "degraded"}
          subText="Connected external endpoints"
        />
      </div>

      {/* Services health table list */}
      <div className="cyber-panel p-6 bg-cyber-panel-light dark:bg-cyber-panel-dark space-y-4">
        <div className="flex items-center space-x-2 border-b border-cyber-border-light dark:border-cyber-border-dark pb-3">
          <Activity size={14} className="text-cyber-accent" />
          <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase">
            Service Endpoint Link State
          </h3>
        </div>

        <div className="overflow-x-auto border border-cyber-border-light dark:border-cyber-border-dark">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-cyber-border-light dark:border-cyber-border-dark text-[10px] uppercase text-slate-500">
                <th className="p-3 text-left font-semibold">Service Name</th>
                <th className="p-3 text-left font-semibold">Link Status</th>
                <th className="p-3 text-left font-semibold">Ping Latency</th>
                <th className="p-3 text-left font-semibold">Diagnostic Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border-light dark:divide-cyber-border-dark">
              {services.map((svc) => (
                <tr
                  key={svc.name}
                  className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300"
                >
                  <td className="p-3 font-bold uppercase tracking-wider text-cyber-primary">
                    {svc.name}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <HealthIndicator status={svc.status} size="sm" />
                      <span className={`text-[10px] font-bold ${
                        svc.status === "ok"
                          ? "text-emerald-500"
                          : svc.status === "degraded"
                          ? "text-red-500 animate-pulse"
                          : "text-slate-400"
                      }`}>
                        {getStatusLabel(svc.status)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500">
                    {svc.latencyMs !== undefined ? `${svc.latencyMs} ms` : "N/A"}
                  </td>
                  <td className="p-3 font-sans text-xs text-slate-500 dark:text-slate-400">
                    {svc.message || "Endpoint link state verified."}
                  </td>
                </tr>
              ))}
              {!services.length && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                    Awaiting endpoint telemetry check...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SystemHealth;
