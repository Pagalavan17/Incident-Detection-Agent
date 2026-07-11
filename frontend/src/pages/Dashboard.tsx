import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useIncident } from "../context/IncidentContext";
import { useHealth } from "../context/HealthContext";
import {
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Brain,
  Database,
  Globe,
  Server,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import RootCauseFlow from "../components/ui/RootCauseFlow";
import LogViewer from "../components/ui/LogViewer";
import AIChat from "../components/ui/AIChat";
import { SeverityBadge, StatusBadge } from "../components/ui";

export const Dashboard: React.FC = () => {
  const { currentIncident } = useIncident();
  const { status, services } = useHealth();
  const [activeChartTab, setActiveChartTab] = useState<"system" | "performance" | "security">("system");

  const hasIncident = !!currentIncident;

  // Find Qdrant Status
  const qdrantService = services.find((s) => s.name === "qdrant");
  const qdrantStatus = qdrantService ? qdrantService.status : "unconfigured";

  // Recharts Mock Datasets
  const errorsOverTimeData = [
    { time: "00:00", errors: 4 },
    { time: "04:00", errors: 3 },
    { time: "08:00", errors: 12 },
    { time: "12:00", errors: 28 },
    { time: "16:00", errors: 15 },
    { time: "20:00", errors: 45 },
    { time: "24:00", errors: 8 },
  ];

  const processingSpeedData = [
    { batch: "B-1", speed: 450 },
    { batch: "B-2", speed: 520 },
    { batch: "B-3", speed: 610 },
    { batch: "B-4", speed: 580 },
    { batch: "B-5", speed: 720 },
    { batch: "B-6", speed: 950 },
  ];

  const resourceUsageData = [
    { time: "10m", cpu: 42, memory: 68 },
    { time: "8m", cpu: 55, memory: 72 },
    { time: "6m", cpu: 89, memory: 91 },
    { time: "4m", cpu: 94, memory: 95 },
    { time: "2m", cpu: 65, memory: 88 },
    { time: "Now", cpu: 48, memory: 84 },
  ];

  const successRateData = [
    { time: "Mon", rate: 99.8 },
    { time: "Tue", rate: 99.9 },
    { time: "Wed", rate: 98.2 },
    { time: "Thu", rate: 95.4 },
    { time: "Fri", rate: 99.1 },
    { time: "Sat", rate: 99.9 },
  ];

  // Anomaly calculation
  const getAnomalyChartData = () => {
    if (!currentIncident?.anomalies) return [
      { name: "Connection Limit", count: 2 },
      { name: "Auth Failure", count: 5 },
      { name: "Rate Limit", count: 3 }
    ];
    const counts: Record<string, number> = {};
    currentIncident.anomalies.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ name: type, count }));
  };

  const getSeverityChartData = () => {
    if (!currentIncident?.anomalies) return [
      { name: "CRITICAL", value: 1, fill: "#EF4444" },
      { name: "ERROR", value: 3, fill: "#F87171" },
      { name: "WARN", value: 4, fill: "#F59E0B" },
      { name: "INFO", value: 10, fill: "#3B82F6" }
    ];
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

  // Mini Sparkline Data
  const sparkline1 = [2, 5, 3, 8, 5, 9, 12];
  const sparkline2 = [45, 48, 42, 51, 60, 58, 64];
  const sparkline3 = [1, 0, 2, 0, 4, 3, 1];
  const sparkline4 = [94.1, 94.2, 94.0, 94.5, 94.2, 94.8, 95.1];

  const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const chartData = data.map((v, i) => ({ id: i, value: v }));
    return (
      <div className="w-16 h-8 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-mono text-left text-white">
      
      {/* Dashboard Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-primary/10 via-[#0F1419]/40 to-transparent border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-glow">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-xl">
          <span className="px-2.5 py-1 text-[9px] bg-brand-neon/10 border border-brand-neon/30 text-brand-neon rounded font-bold uppercase tracking-widest animate-pulse">
            COGNITIVE SEC-OPS SYSTEM ACTIVE
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-white via-text-secondary to-brand-neon bg-clip-text text-transparent">
            Incident Log Analysis
          </h1>
          <p className="text-xs font-sans text-text-secondary leading-relaxed">
            Upload production logs and let AI identify root causes, affected services, severity, and remediation steps. Correlate vector mappings against threat signatures.
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white border border-brand-accent/30 rounded-lg shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer uppercase"
            >
              <Plus size={12} />
              Analyze New Log Batch
            </Link>
          </div>
        </div>

        {/* 3D Glowing Server Graphic / Cyber Illustration (Sleek Inline SVG) */}
        <div className="w-40 h-40 md:w-48 md:h-48 flex-shrink-0 flex items-center justify-center relative select-none">
          <svg className="w-full h-full text-brand-neon animate-pulse" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <rect x="25" y="15" width="50" height="15" rx="3" fill="url(#glowGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="35" cy="22.5" r="2" fill="#00D9FF" className="animate-ping" />
            <circle cx="45" cy="22.5" r="1.5" fill="#22C55E" />
            <line x1="55" y1="22.5" x2="68" y2="22.5" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="1 2" />
            
            <rect x="25" y="38" width="50" height="15" rx="3" fill="url(#glowGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="35" cy="45.5" r="2" fill="#EF4444" className="animate-ping" />
            <circle cx="45" cy="45.5" r="1.5" fill="#F59E0B" />
            <line x1="55" y1="45.5" x2="68" y2="45.5" stroke="#00D9FF" strokeWidth="1.5" />

            <rect x="25" y="61" width="50" height="15" rx="3" fill="url(#glowGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="35" cy="68.5" r="2" fill="#00D9FF" />
            <circle cx="45" cy="68.5" r="1.5" fill="#22C55E" />
            
            {/* Holographic glowing grids */}
            <path d="M 15,85 L 30,78 M 85,85 L 70,78 M 50,8 L 50,14" stroke="#00D9FF" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </div>
      </section>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: API Health */}
        <div className="bg-[#111827] border border-white/10 hover:border-brand-primary/45 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-glow pointer-events-none group">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">Overall Health</span>
            <p className="text-base font-bold text-white font-mono flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {status === "ok" ? "OPERATIONAL" : "DEGRADED"}
            </p>
            <span className="text-[8px] text-emerald-400 font-sans flex items-center gap-0.5">
              <TrendingUp size={10} /> 100.0% UPTIME
            </span>
          </div>
          <Sparkline data={sparkline1} color="#22C55E" />
        </div>

        {/* Card 2: Files Processed */}
        <div className="bg-[#111827] border border-white/10 hover:border-brand-primary/45 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-glow pointer-events-none">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">Files Ingested</span>
            <p className="text-lg font-bold text-white font-mono">
              {hasIncident ? "1,284" : "1,281"}
            </p>
            <span className="text-[8px] text-emerald-400 font-sans flex items-center gap-0.5">
              <TrendingUp size={10} /> +12.3% WEEKLY
            </span>
          </div>
          <Sparkline data={sparkline2} color="#00D9FF" />
        </div>

        {/* Card 3: Active Incident Errors */}
        <div className="bg-[#111827] border border-white/10 hover:border-brand-primary/45 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-glow pointer-events-none">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">Errors Detected</span>
            <p className="text-lg font-bold text-red-400 font-mono">
              {hasIncident ? currentIncident.anomalies.length : "0"}
            </p>
            <span className="text-[8px] text-red-400 font-sans flex items-center gap-0.5">
              <TrendingDown size={10} /> {hasIncident ? "+3 SIGNALS" : "STABLE"}
            </span>
          </div>
          <Sparkline data={sparkline3} color="#EF4444" />
        </div>

        {/* Card 4: Active Warnings */}
        <div className="bg-[#111827] border border-white/10 hover:border-brand-primary/45 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-glow pointer-events-none">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">Warnings</span>
            <p className="text-lg font-bold text-amber-400 font-mono">
              {hasIncident ? Math.round(currentIncident.anomalies.length * 1.5) : "2"}
            </p>
            <span className="text-[8px] text-amber-400 font-sans flex items-center gap-0.5">
              <TrendingUp size={10} /> ELEVATED SLAs
            </span>
          </div>
          <Sparkline data={sparkline1} color="#F59E0B" />
        </div>

        {/* Card 5: AI Confidence */}
        <div className="bg-[#111827] border border-white/10 hover:border-brand-primary/45 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-glow pointer-events-none">
          <div className="space-y-1">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">AI Confidence</span>
            <p className="text-lg font-bold text-brand-neon font-mono">
              {hasIncident && currentIncident.rootCause ? `${Math.round(currentIncident.rootCause.confidence * 100)}%` : "94.2%"}
            </p>
            <span className="text-[8px] text-emerald-400 font-sans flex items-center gap-0.5">
              <TrendingUp size={10} /> +1.2% MODEL GAIN
            </span>
          </div>
          <Sparkline data={sparkline4} color="#8B5CF6" />
        </div>
      </div>

      {hasIncident ? (
        <div className="space-y-6">
          
          {/* AI Incident Analysis Overview Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* AI Summary Card (col-span-8) */}
            <div className="lg:col-span-8 bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-glow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={currentIncident.incident.severity.toLowerCase() as any} />
                    <StatusBadge status="danger" label={currentIncident.incident.lifecycle} />
                  </div>
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock size={10} /> DETECTED: {new Date(currentIncident.incident.detectedAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[8px] uppercase text-text-muted font-bold tracking-widest block">
                    AI Correlated Outage Scope
                  </span>
                  <h3 className="text-base font-extrabold uppercase mt-1 leading-snug text-white">
                    {currentIncident.incident.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs border-t border-white/5">
                  <div className="bg-white/2 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-text-muted uppercase block">Affected Service</span>
                    <span className="font-bold text-brand-neon uppercase font-mono block mt-1">
                      {currentIncident.incident.title.split(" ").slice(-1)[0] || "Payment Service"}
                    </span>
                  </div>
                  <div className="bg-white/2 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-text-muted uppercase block">Probable Cause</span>
                    <span className="font-bold text-red-400 uppercase font-mono block mt-1 truncate" title={currentIncident.rootCause?.probableCause}>
                      {currentIncident.rootCause?.probableCause || "Connection Pool Exhaustion"}
                    </span>
                  </div>
                  <div className="bg-white/2 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-text-muted uppercase block">Estimated Fix Time</span>
                    <span className="font-bold text-emerald-400 font-mono block mt-1">
                      ~15 MINUTES
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress to target resolution and executive summaries link */}
              <div className="pt-5 flex items-center justify-between border-t border-white/5 mt-5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-neon">
                    <Brain size={12} className="animate-spin" />
                  </div>
                  <span className="text-text-secondary">SecOps AI finalized diagnostics check</span>
                </div>
                <Link
                  to="/details"
                  className="inline-flex items-center text-[10px] text-brand-neon hover:text-brand-primary font-bold hover:underline gap-0.5"
                >
                  EXPLORE FULL INCIDENT TELEMETRY
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* AI Action/Guardrail Pipeline Summaries (col-span-4) */}
            <div className="lg:col-span-4 bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4">
                Executive Diagnostics Checks
              </h3>
              
              <div className="space-y-4 flex-1">
                {/* RCA status */}
                {currentIncident.rootCause && (
                  <div className="text-xs leading-relaxed space-y-1">
                    <span className="text-[8px] uppercase font-bold text-red-500 font-mono">Root Cause Diagnosis</span>
                    <p className="text-[11px] font-sans text-text-secondary leading-relaxed line-clamp-2">
                      {currentIncident.rootCause.probableCause}
                    </p>
                  </div>
                )}

                {/* Remediation Check */}
                {currentIncident.remediation && (
                  <div className="text-xs leading-relaxed space-y-1">
                    <span className="text-[8px] uppercase font-bold text-brand-accent font-mono">Remediation Rollbook</span>
                    <p className="text-[11px] font-sans text-text-secondary leading-relaxed line-clamp-2">
                      {currentIncident.remediation.immediateActions?.[0] || "Execute rolling restart and clear socket pools."}
                    </p>
                  </div>
                )}

                {/* Guardrails check status */}
                {currentIncident.guardrails && (
                  <div className="text-xs leading-relaxed space-y-1">
                    <span className="text-[8px] uppercase font-bold text-emerald-400 font-mono">Safety Compliance Status</span>
                    <p className="text-[11px] font-sans text-text-secondary">
                      Validated: {currentIncident.guardrails.approved ? "APPROVED (Safe to execute)" : "REJECTED"} (Risk Level: {currentIncident.guardrails.riskLevel})
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 mt-4 text-center">
                <Link
                  to="/remediation"
                  className="text-[9px] text-brand-neon hover:text-white uppercase font-bold hover:underline"
                >
                  Inspect Remediation Runbook Commands
                </Link>
              </div>
            </div>

          </div>

          {/* Interactive Root Cause Propagation Flow diagram */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Failure Chain Analysis
            </h3>
            <RootCauseFlow />
          </div>

          {/* Recharts Analytics Panel - Premium Tabs */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  SOC Interactive Telemetry Plots
                </h3>
                <p className="text-[9px] text-text-muted mt-1 uppercase">
                  Recharts metrics correlation graphs
                </p>
              </div>
              
              {/* Tab options selector */}
              <div className="flex items-center gap-1.5 bg-black/30 p-1 border border-white/10 rounded-xl">
                {[
                  { id: "system", label: "System Load" },
                  { id: "performance", label: "Pipeline Stats" },
                  { id: "security", label: "Threat Incidents" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChartTab(tab.id as any)}
                    className={`px-3 py-1 text-[10px] rounded-lg cursor-pointer transition-all font-sans font-bold uppercase ${
                      activeChartTab === tab.id
                        ? "bg-brand-primary text-white"
                        : "text-text-muted hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Charts Grid */}
            <div className="h-64 text-xs font-mono">
              {activeChartTab === "system" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Chart 1: Resource Usage CPU/Memory */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Node CPU vs Memory Usage (%)</span>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={resourceUsageData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                          <Area type="monotone" dataKey="cpu" stroke="#00D9FF" fill="rgba(0,217,255,0.1)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="memory" stroke="#8B5CF6" fill="rgba(139,92,246,0.1)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Success Rate */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Transactional Success Rate (%)</span>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={successRateData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[90, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                          <Line type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeChartTab === "performance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Chart 3: Ingestion Speeds */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Ingestion Processing Speed (Logs/sec)</span>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processingSpeedData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="batch" stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                          <Area type="monotone" dataKey="speed" stroke="#3B82F6" fill="rgba(59,130,246,0.1)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 4: Anomaly breakdown */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Detected Anomalies by Type</span>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={anomalyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                          <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                            {anomalyData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#4F46E5" : "#00D9FF"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeChartTab === "security" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Chart 5: Errors over Time */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Errors over Time (Logs timeline)</span>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={errorsOverTimeData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                          <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={1.5} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 6: Severity pie */}
                  <div className="h-full flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-text-muted uppercase mb-2">Severity Level Distribution</span>
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={severityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1.5 text-[9px] justify-center ml-2">
                        {severityData.map((e) => (
                          <span key={e.name} className="flex items-center gap-1 text-[9px] font-mono">
                            <span className="w-1.5 h-1.5 inline-block" style={{ backgroundColor: e.fill }} />
                            <span className="text-slate-300 font-bold uppercase">{e.name}: {e.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Threat Intelligence Summary Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Active Threat Intelligence Feed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Latest CVE */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[10px] font-bold text-red-400 font-mono">CVE-2026-38294</span>
                  <span className="px-1.5 py-0.5 text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold">9.8 HIGH</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal font-sans">
                  Postgres pool connection pool starvation vulnerability allows socket resource exhaustion attack vectors.
                </p>
                <div className="text-[8px] text-text-dim font-mono uppercase flex items-center justify-between">
                  <span>MITRE Tactics</span>
                  <span className="text-white font-bold">Credential Access</span>
                </div>
              </div>

              {/* Card 2: Origins Map Sim */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[10px] font-bold text-white uppercase">Attack Origins</span>
                  <span className="text-[8px] text-brand-neon font-bold">3 ACTIVE IPS</span>
                </div>
                <div className="flex-1 flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-neon">
                    <Globe size={18} className="animate-spin" />
                  </div>
                  <div className="text-[9px] font-mono leading-tight space-y-0.5">
                    <p className="text-white font-bold">203.0.113.11 (GCP Edge)</p>
                    <p className="text-text-muted">Origin country: US East</p>
                  </div>
                </div>
                <div className="text-[8px] text-text-dim font-mono uppercase flex items-center justify-between">
                  <span>Geo Latency</span>
                  <span className="text-brand-neon font-bold">22ms</span>
                </div>
              </div>

              {/* Card 3: MITRE ATT&CK Matrix */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[10px] font-bold text-white uppercase">MITRE ATT&CK Matrix</span>
                  <span className="text-[8px] text-emerald-400 font-bold">T1190</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal font-sans">
                  Exploit Public-Facing Application identified across payment gateway callback endpoints.
                </p>
                <div className="text-[8px] text-text-dim font-mono uppercase flex items-center justify-between">
                  <span>Status Audit</span>
                  <span className="text-emerald-400 font-bold">DECORRELATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Log Ingestion Console */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Normalized Logs Telemetry Stream
            </h3>
            <LogViewer logs={currentIncident.incident.logBatch?.entries || []} />
          </div>

        </div>
      ) : (
        /* Empty Command Dashboard View (Hero section with Large CTA log uploader) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="border-b border-white/5 pb-3 mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Log Ingestion Module
              </h3>
              <p className="text-[9px] text-text-muted mt-1 uppercase">
                Ingest log streams to trigger diagnostic pipelines
              </p>
            </div>
            {/* Quick logs uploader forms */}
            <LogViewer logs={[]} />
            <div className="text-center pt-8 border-t border-white/5 mt-6">
              <p className="text-xs text-text-secondary font-sans max-w-md mx-auto mb-4 leading-relaxed">
                To initialize the Ops Diagnostics Cockpit, submit server node log batches or pre-fill templates using the log ingestion tab.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white font-bold text-xs rounded-xl shadow-lg border border-brand-accent/30 transition-all uppercase"
              >
                Ingest Log Files
              </Link>
            </div>
          </div>

          {/* Service Links and general SOC statistics */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
                Operational Node Links
              </h3>
              <div className="space-y-3">
                {/* Postgres link */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-brand-accent" />
                    <span className="text-text-secondary">Postgres Node</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">ONLINE</span>
                </div>
                {/* Qdrant link */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-brand-neon" />
                    <span className="text-text-secondary">Qdrant Vector Node</span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[8px] border rounded font-bold ${qdrantStatus === "ok" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {qdrantStatus === "ok" ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
                {/* AI Model link */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-brand-purple" />
                    <span className="text-text-secondary">Claude 3.5 Sonnet API</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Ingest schema requirements overview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-text-secondary leading-relaxed font-sans">
              <h4 className="font-mono text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                Diagnostics Policy
              </h4>
              <p className="text-[11px] mb-3 leading-relaxed">
                The agent utilizes embeddings in vector nodes to retrieve historical matches, calculates failure probabilities across database pools, and automatically verifies compliance against Safety Guardrails.
              </p>
              <Link to="/settings" className="text-[9px] font-mono font-bold text-brand-neon hover:underline uppercase block">
                Inspect AI Model Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat Assistant */}
      <AIChat />
    </div>
  );
};

export default Dashboard;
