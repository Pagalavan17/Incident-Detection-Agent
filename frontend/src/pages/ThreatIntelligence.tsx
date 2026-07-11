import React, { useState } from "react";
import {
  ShieldAlert,
  Server,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from "recharts";

export const ThreatIntelligence: React.FC = () => {
  const [activeIocTab, setActiveIocTab] = useState<"ips" | "hashes" | "domains">("ips");

  // Mock Threat Intel Data
  const cveList = [
    { id: "CVE-2026-38294", score: "9.8", severity: "CRITICAL", desc: "RDS Postgres connections socket pool exhaust vulnerability allows unauthenticated attackers to cause complete denial-of-service cascade.", patch: "Apply postgres-driver hotfix-v12" },
    { id: "CVE-2026-10493", score: "7.5", severity: "HIGH", desc: "API Gateway session token validation parsing error leads to potential authentication bypass on nested callback routes.", patch: "Upgrade ingress controller to v1.2" },
    { id: "CVE-2025-54911", score: "5.4", severity: "MEDIUM", desc: "HTTP header parsing stack memory overflow in Node.js HTTP parser under specific multi-chunk payload conditions.", patch: "Upgrade engine runtime node v22.12" }
  ];

  const iocIps = [
    { value: "203.0.113.11", type: "GCP Ingress", host: "gke-ingress-node", threatLevel: "CRITICAL" },
    { value: "198.51.100.42", type: "AWS Flow Log", host: "ec2-instance-target", threatLevel: "HIGH" },
    { value: "185.190.140.9", type: "Botnet node", host: "direct-socket-burst", threatLevel: "CRITICAL" }
  ];

  const iocHashes = [
    { value: "sha256:d8a2bf689e47...1f", type: "RCA Leak Trigger Script", host: "checkout-repository", threatLevel: "MEDIUM" },
    { value: "sha256:7f01c8901b22...c3", type: "Malicious payload ELF", host: "worker-tmp-dir", threatLevel: "CRITICAL" }
  ];

  const iocDomains = [
    { value: "checkout-callback.net", type: "C2 Callback Gateway", host: "proxy-forwarder", threatLevel: "CRITICAL" },
    { value: "secops-audits.org", type: "Phishing registry", host: "unknown-socket", threatLevel: "HIGH" }
  ];

  const riskTrendData = [
    { day: "07-03", score: 45 },
    { day: "07-04", score: 48 },
    { day: "07-05", score: 65 },
    { day: "07-06", score: 82 },
    { day: "07-07", score: 94 },
    { day: "07-08", score: 92 },
    { day: "07-09", score: 95 }
  ];

  return (
    <div className="space-y-6 font-mono text-left text-white max-w-7xl mx-auto">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
          Threat Intelligence Center
        </h1>
        <p className="text-[10px] text-text-muted mt-1 uppercase">
          MITRE ATT&CK mappings, CVE vulnerabilities indexes, and threat actor feeds
        </p>
      </div>

      {/* Grid: Left Column (col-span-8), Right Column (col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (col-span-8): CVEs & MITRE ATT&CK */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CVE vulnerability list */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-500" />
              Latest Vulnerability Indexes (CVE)
            </h3>
            
            <div className="space-y-4">
              {cveList.map((cve) => (
                <div key={cve.id} className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-xl space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{cve.id}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                        cve.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                      }`}>
                        CVSS {cve.score}
                      </span>
                    </div>
                    <span className="text-[8px] text-text-muted">HOTFIX RECOMMENDED</span>
                  </div>
                  <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                    {cve.desc}
                  </p>
                  <div className="text-[9px] text-brand-neon bg-brand-neon/5 border border-brand-neon/10 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                    <span>Mitigation: <strong className="text-white">{cve.patch}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MITRE ATT&CK Matrix tactics */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Server size={14} className="text-brand-neon" />
              MITRE ATT&CK Matrix Tactics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
              {[
                { name: "Initial Access", id: "T1190", tech: "Exploit Public-Facing App", active: true },
                { name: "Execution", id: "T1059", tech: "Command and Script Interpreter", active: false },
                { name: "Exfiltration", id: "T1048", tech: "Exfiltration Over Alternative Protocol", active: false },
                { name: "Impact", id: "T1499", tech: "Endpoint Denial of Service", active: true },
              ].map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${
                  item.active ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/2 border-white/5 text-text-muted"
                } flex flex-col justify-between h-28`}>
                  <div>
                    <span className="text-[8px] font-mono uppercase tracking-wider block mb-1">TACTIC</span>
                    <h5 className="font-bold text-white text-[10px] leading-tight">{item.name}</h5>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-2 font-mono text-[9px] flex items-center justify-between">
                    <span>{item.id}</span>
                    <span className={item.active ? "text-red-400 font-bold" : "text-text-dim"}>{item.active ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (col-span-4): Risk trends, Threat actors & IOCs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Geolocation attack map simulation */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-2 mb-3">
              Geo-Threat Mapping Plot
            </h3>
            {/* Visual simulation area */}
            <div className="h-32 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-6 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <div className="absolute bottom-6 right-10 w-2 h-2 bg-brand-neon rounded-full animate-pulse" />
              <div className="absolute top-12 right-20 w-1.5 h-1.5 bg-red-400 rounded-full" />
              <svg className="w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 60">
                <path d="M10,15 C20,10 40,25 60,15 C70,10 80,45 90,40 C100,35 100,50 90,55" fill="none" stroke="#fff" strokeWidth="0.5" />
                <line x1="6" y1="4" x2="90" y2="55" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1 2" className="animate-pulse" />
              </svg>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] bg-black/80 px-1.5 py-0.5 rounded font-mono">
                <MapPin size={8} className="text-red-500" />
                <span>203.0.113.11 &gt; GKE-NODE-99</span>
              </div>
            </div>
          </div>

          {/* Risk Score Trends chart */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
              <h3 className="text-xs font-bold tracking-widest text-white uppercase">
                Risk Trend Index
              </h3>
              <span className="text-[8px] text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                <TrendingUp size={10} /> +2.1% SLA
              </span>
            </div>
            <div className="h-28 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={8} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", fontSize: 9 }} />
                  <Area type="monotone" dataKey="score" stroke="#EF4444" fill="rgba(239,68,68,0.1)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Indicators of Compromise tab container */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold tracking-widest text-white uppercase">
                Active IOC Lists
              </h3>
              {/* Mini Tab selector */}
              <div className="flex items-center bg-black/40 p-0.5 border border-white/10 rounded-lg">
                {["ips", "hashes", "domains"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveIocTab(t as any)}
                    className={`px-2 py-0.5 text-[8px] rounded font-bold uppercase cursor-pointer ${
                      activeIocTab === t ? "bg-brand-primary text-white" : "text-text-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(activeIocTab === "ips" ? iocIps : activeIocTab === "hashes" ? iocHashes : iocDomains).map((ioc, idx) => (
                <div key={idx} className="p-2 bg-white/2 border border-white/5 rounded-lg flex items-center justify-between text-[10px]">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white truncate max-w-[140px]">{ioc.value}</span>
                    <span className="text-[8px] text-text-dim mt-0.5 truncate">{ioc.type}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[7px] font-bold rounded ${
                    ioc.threatLevel === "CRITICAL" ? "bg-red-500/20 text-red-400" : ioc.threatLevel === "HIGH" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {ioc.threatLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ThreatIntelligence;
