import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useHealth } from "../../context/HealthContext";
import { useIncident } from "../../context/IncidentContext";
import { Sun, Moon, ShieldAlert, ShieldCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { status } = useHealth();
  const { currentIncident } = useIncident();

  return (
    <header className="h-16 border-b border-cyber-border-light dark:border-cyber-border-dark bg-cyber-panel-light dark:bg-cyber-panel-dark text-slate-800 dark:text-slate-100 px-6 flex items-center justify-between select-none">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-1.5 bg-cyber-primary text-white dark:bg-cyber-primary/20 dark:text-cyber-primary-dark border border-cyber-primary">
            <ShieldAlert size={20} />
          </div>
          <span className="font-mono font-bold tracking-widest text-sm uppercase md:text-base">
            Incident-Response.io
          </span>
        </Link>
        
        {/* Backend Connectivity Status Badge */}
        <div className="flex items-center space-x-2 border-l border-cyber-border-light dark:border-cyber-border-dark pl-3">
          {status === "ok" ? (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={12} className="mr-1" />
              API CONNECTED
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-500/30 animate-pulse">
              <ShieldAlert size={12} className="mr-1" />
              API DEGRADED
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {currentIncident && (
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">RUN:</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-cyber-border-light dark:border-cyber-border-dark">
              {currentIncident.incident.runId.substring(0, 8)}...
            </span>
          </div>
        )}
        
        {/* Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 border border-cyber-border-light dark:border-cyber-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
export default Navbar;
