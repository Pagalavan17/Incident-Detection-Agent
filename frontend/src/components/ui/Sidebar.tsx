import React from "react";
import { NavLink } from "react-router-dom";
import { useIncident } from "../../context/IncidentContext";
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Compass, 
  FileCode, 
  Activity, 
  ShieldCheck, 
  FileQuestion,
  Lock
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { currentIncident } = useIncident();

  const hasIncident = !!currentIncident;
  const hasRca = !!currentIncident?.rootCause;
  const hasRemediation = !!currentIncident?.remediation;
  const hasGuardrails = !!currentIncident?.guardrails;
  const hasPostMortem = !!currentIncident?.postMortem;

  // Shared classes for menu items
  const baseLinkClass = "flex items-center space-x-3 px-4 py-3 text-sm font-medium tracking-wide uppercase transition-all border-b border-cyber-border-light dark:border-cyber-border-dark select-none";
  const activeClass = "bg-cyber-primary/10 text-cyber-primary border-l-2 border-l-cyber-primary";
  const inactiveClass = "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40";
  const disabledClass = "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50";

  return (
    <aside className="w-64 border-r border-cyber-border-light dark:border-cyber-border-dark bg-cyber-panel-light dark:bg-cyber-panel-dark h-[calc(100vh-64px)] flex flex-col justify-between font-mono">
      <div className="flex flex-col">
        {/* Dashboard Link */}
        <NavLink
          to="/"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        {/* Upload Logs Link */}
        <NavLink
          to="/upload"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
        >
          <UploadCloud size={16} />
          <span>Upload Logs</span>
        </NavLink>

        {/* Incident Details Link */}
        {hasIncident ? (
          <NavLink
            to="/details"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <FileText size={16} />
            <span>Incident Details</span>
          </NavLink>
        ) : (
          <div className={`${baseLinkClass} ${disabledClass}`} title="Upload logs first to view details">
            <Lock size={14} className="text-slate-400 dark:text-slate-600" />
            <span>Incident Details</span>
          </div>
        )}

        {/* Root Cause Link */}
        {hasIncident && hasRca ? (
          <NavLink
            to="/root-cause"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <Compass size={16} />
            <span>Root Cause</span>
          </NavLink>
        ) : (
          <div className={`${baseLinkClass} ${disabledClass}`} title="Requires Root Cause Analysis findings">
            <Lock size={14} className="text-slate-400 dark:text-slate-600" />
            <span>Root Cause</span>
          </div>
        )}

        {/* Remediation Link */}
        {hasIncident && hasRemediation ? (
          <NavLink
            to="/remediation"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <FileCode size={16} />
            <span>Remediation</span>
          </NavLink>
        ) : (
          <div className={`${baseLinkClass} ${disabledClass}`} title="Requires Remediation recommendations">
            <Lock size={14} className="text-slate-400 dark:text-slate-600" />
            <span>Remediation</span>
          </div>
        )}

        {/* Guardrails Link */}
        {hasIncident && hasGuardrails ? (
          <NavLink
            to="/guardrails"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <ShieldCheck size={16} />
            <span>Guardrails</span>
          </NavLink>
        ) : (
          <div className={`${baseLinkClass} ${disabledClass}`} title="Requires Guardrails validation checks">
            <Lock size={14} className="text-slate-400 dark:text-slate-600" />
            <span>Guardrails</span>
          </div>
        )}

        {/* Post-Mortem Link */}
        {hasIncident && hasPostMortem ? (
          <NavLink
            to="/post-mortem"
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <FileQuestion size={16} />
            <span>Post-Mortem</span>
          </NavLink>
        ) : (
          <div className={`${baseLinkClass} ${disabledClass}`} title="Requires Post-Mortem generated report">
            <Lock size={14} className="text-slate-400 dark:text-slate-600" />
            <span>Post-Mortem</span>
          </div>
        )}

        {/* System Health Link */}
        <NavLink
          to="/health"
          className={({ isActive }) => `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
        >
          <Activity size={16} />
          <span>System Health</span>
        </NavLink>
      </div>

      <div className="p-4 text-center border-t border-cyber-border-light dark:border-cyber-border-dark text-[10px] text-slate-500 dark:text-slate-500 font-mono tracking-wider">
        SEC_OP_AGNT // V1.0.0
      </div>
    </aside>
  );
};
export default Sidebar;
