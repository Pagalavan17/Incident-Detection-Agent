import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useHealth } from "../../context/HealthContext";
import { useIncident } from "../../context/IncidentContext";
import { useSidebar } from "../../context/SidebarContext";
import { BREADCRUMB_LABELS } from "../../config/navigation";
import {
  Sun,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const DashboardHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { status } = useHealth();
  const { currentIncident } = useIncident();
  const { isMobile, isOpen: isMobileOpen, toggle: toggleMobile } = useSidebar();
  const location = useLocation();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const pageLabel = BREADCRUMB_LABELS[location.pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#070B14]/90 via-[#0F1419]/90 to-[#070B14]/90 px-4 backdrop-blur-xl select-none text-white md:px-6">
      {/* Left Area: Logo & Mobile Toggle */}
      <div className="flex min-w-0 items-center space-x-3">
        {isMobile && (
          <button
            type="button"
            onClick={toggleMobile}
            className="flex-shrink-0 cursor-pointer border border-white/10 p-2 text-text-muted transition-all hover:bg-white/5 rounded-lg"
            aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}

        <Link to="/" className="flex min-w-0 items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-neon">
            <ShieldAlert size={16} className="animate-pulse" />
          </div>
          <span className="hidden truncate font-mono text-sm font-bold uppercase tracking-widest sm:inline md:text-base bg-gradient-to-r from-white via-text-secondary to-brand-neon bg-clip-text text-transparent">
            IRA.SOC
          </span>
        </Link>

        {/* API connection indicator badge */}
        <div className="hidden items-center space-x-2 border-l border-white/10 pl-3 sm:flex">
          {status === "ok" ? (
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded">
              <ShieldCheck size={10} className="mr-1" />
              API CONNECTED
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold border border-red-500/20 bg-red-500/10 text-red-400 rounded animate-pulse">
              <ShieldAlert size={10} className="mr-1" />
              API DEGRADED
            </span>
          )}
        </div>
      </div>

      {/* Middle Area: Global Search */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-6">
        <motion.div
          animate={isSearchFocused ? { scale: 1.01, borderColor: "rgba(0, 217, 255, 0.4)" } : { scale: 1 }}
          className="relative w-full flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all duration-200"
        >
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search logs, microservices, CVEs..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-transparent outline-none text-xs text-white placeholder-text-dim border-none p-0 focus:ring-0"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 select-none rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium text-text-muted">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </motion.div>
      </div>

      {/* Right Area: Alerts, Theme, RunID, User Avatar */}
      <div className="flex flex-shrink-0 items-center space-x-3 md:space-x-4">
        {/* Active session run status badge */}
        {currentIncident && (
          <div className="hidden items-center space-x-1.5 lg:flex font-mono text-[10px] border border-white/5 bg-white/5 px-2 py-1 rounded">
            <span className="text-text-dim uppercase">RUN:</span>
            <span className="text-brand-neon font-bold">
              {currentIncident.incident.runId.substring(0, 8)}
            </span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="cursor-pointer border border-white/10 p-2 text-text-muted transition-all hover:bg-white/5 rounded-lg"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications Icon with Panel */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative border border-white/10 p-2 text-text-muted transition-all hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-72 bg-[#111827] border border-white/10 rounded-xl shadow-xl z-50 p-2 font-mono text-left"
                >
                  <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">System Logs</span>
                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-bold">3 NEW</span>
                  </div>
                  <div className="py-1 space-y-1">
                    <div className="p-2 hover:bg-white/5 rounded text-[10px] text-text-secondary cursor-pointer">
                      <p className="text-red-400 font-semibold uppercase">🚨 CRITICAL FAILURE</p>
                      <p className="text-slate-400 mt-0.5 line-clamp-1">payment-service socket timeout</p>
                    </div>
                    <div className="p-2 hover:bg-white/5 rounded text-[10px] text-text-secondary cursor-pointer">
                      <p className="text-amber-400 font-semibold uppercase">⚠️ THREAT DETECTED</p>
                      <p className="text-slate-400 mt-0.5 line-clamp-1">Connection burst limit triggered</p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-6 bg-white/10" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-[10px] font-bold text-white">
              JD
            </div>
            <span className="hidden md:block text-xs font-semibold font-sans">{pageLabel === "Settings" ? "Admin" : "John Doe"}</span>
            <ChevronDown size={12} className={`text-text-muted transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-[#111827] border border-white/10 rounded-xl shadow-xl z-50 p-1.5 font-mono text-left"
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white font-sans">John Doe</p>
                    <p className="text-[9px] text-brand-neon font-mono mt-0.5">Security Administrator</p>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <Settings size={12} />
                      Settings
                    </Link>
                    <div className="border-t border-white/5 my-1" />
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-left">
                      <LogOut size={12} />
                      Log Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
