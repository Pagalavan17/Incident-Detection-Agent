import React, { useState } from "react";
import {
  User,
  Bell,
  Sliders,
  Key,
  Shield,
  Info,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "api" | "models" | "security" | "about">("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "models", label: "AI Models", icon: Sliders },
    { id: "security", label: "Security", icon: Shield },
    { id: "about", label: "About System", icon: Info },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 font-mono text-left text-white max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold tracking-widest text-white uppercase bg-gradient-to-r from-white to-brand-neon bg-clip-text text-transparent">
          System Control Center
        </h1>
        <p className="text-[10px] text-text-muted mt-1 uppercase">
          Configure security rules, active models integration, API thresholds and audit parameters
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Navigation Tabs (col-span-3) */}
        <div className="md:col-span-3 flex flex-col gap-1.5 bg-[#111827] border border-white/10 rounded-2xl p-3">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wider transition-all select-none cursor-pointer ${
                  isTabActive
                    ? "bg-brand-primary text-white border-l-2 border-l-brand-neon font-bold shadow-md"
                    : "text-text-muted hover:text-white hover:bg-white/5 border-l-2 border-l-transparent"
                }`}
              >
                <TabIcon size={14} className={isTabActive ? "text-brand-neon" : "text-text-muted"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Contents (col-span-9) */}
        <div className="md:col-span-9 bg-[#111827] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSave} className="space-y-6">
            
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    User Credentials
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted">Username</label>
                      <input type="text" defaultValue="John Doe" className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon" />
                    </div>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted">Email Scope</label>
                      <input type="email" defaultValue="j.doe@secops.io" className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5 text-xs">
                    <label className="text-text-muted">Assigned Security Role</label>
                    <input type="text" defaultValue="System Security Administrator" disabled className="bg-[#070B14]/40 border border-white/5 rounded-lg p-2.5 text-xs text-text-dim cursor-not-allowed" />
                  </div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    Notification Trigger Thresholds
                  </h3>
                  <div className="space-y-3 font-sans">
                    {[
                      { label: "Trigger alarm on Critical severity anomalies", active: true },
                      { label: "Email daily SecOps diagnostics post-mortem reports", active: true },
                      { label: "Send webhook callbacks to Slack for connection leaks", active: false },
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-3 text-xs text-text-secondary cursor-pointer select-none">
                        <input type="checkbox" defaultChecked={item.active} className="w-4 h-4 rounded bg-[#070B14] border-white/10 text-brand-primary focus:ring-brand-neon" />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "api" && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    SecOps Integrations API Keys
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted">Enkrypt AI API Key</label>
                      <input type="password" defaultValue="••••••••••••••••••••••••••••••••" className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon" />
                    </div>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted">Qdrant Vector Server URL</label>
                      <input type="text" defaultValue="http://localhost:6333" className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "models" && (
                <motion.div
                  key="models"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    Cognitive AI Models Weighting
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted flex justify-between">
                        <span>Classification Model (Claude 3.5 Sonnet)</span>
                        <span className="text-brand-neon font-bold">Default (Temperature: 0.1)</span>
                      </label>
                      <input type="range" min="0" max="100" defaultValue="10" className="w-full h-1 bg-[#070B14] rounded-lg appearance-none cursor-pointer accent-brand-neon" />
                    </div>
                    <div className="flex flex-col space-y-1.5 text-xs">
                      <label className="text-text-muted flex justify-between">
                        <span>Embedding Dimension Map</span>
                        <span className="text-brand-neon font-bold">1536 (text-embedding-3-small)</span>
                      </label>
                      <input type="range" min="0" max="100" defaultValue="80" className="w-full h-1 bg-[#070B14] rounded-lg appearance-none cursor-pointer accent-brand-neon" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    Admin Session Security
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-text-muted">Auto Logoff Period</label>
                      <select className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon">
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>1 Hour</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-text-muted">Safety Policy Enforcement</label>
                      <select className="bg-[#070B14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-neon">
                        <option>Strict Compliance (Decline Auto-Fixes)</option>
                        <option>Permissive (Log Violations)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">
                    System Information (SecOps Agent)
                  </h3>
                  <div className="space-y-2 text-[10px] text-text-secondary leading-relaxed font-mono">
                    <p>SYSTEM LAYER: <strong className="text-brand-neon">Mastra Agentic Framework</strong></p>
                    <p>FRONTEND CODENAME: <strong className="text-brand-neon">SEC_OP_AGNT // v1.0.0</strong></p>
                    <p>COMPILER TARGET: <strong className="text-brand-neon">React 19 + TypeScript 5</strong></p>
                    <p>CORRELATION ENGINES: <strong className="text-brand-neon">Qdrant Vector Hub + AI Reasoning Model</strong></p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Buttons */}
            {activeTab !== "about" && (
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white text-xs font-bold rounded-lg border border-brand-accent/30 shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer uppercase"
                >
                  Save Configuration
                </button>

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-xs font-sans font-semibold"
                  >
                    <CheckCircle size={14} />
                    Settings saved successfully!
                  </motion.div>
                )}
              </div>
            )}

          </form>

        </div>

      </div>
    </div>
  );
};

export default Settings;
