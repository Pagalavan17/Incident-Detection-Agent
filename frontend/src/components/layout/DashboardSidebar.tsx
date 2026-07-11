import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Shield,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { DASHBOARD_NAV_ITEMS } from "../../config/navigation";

export const DashboardSidebar: React.FC = () => {
  const { isOpen: isMobileOpen, isMobile, close: closeMobile } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine width based on collapse state on desktop
  const isSidebarCollapsed = isMobile ? false : isCollapsed;

  const sidebarVariants = {
    open: { width: "260px" },
    collapsed: { width: "80px" },
  };

  const labelVariants = {
    open: { opacity: 1, x: 0, display: "inline-block" },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" } },
  };

  const renderNavItem = (item: (typeof DASHBOARD_NAV_ITEMS)[number]) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={item.to === "/"}
        onClick={isMobile ? closeMobile : undefined}
        className={({ isActive }) =>
          `relative flex items-center gap-3 px-4 py-3.5 transition-all duration-200 group border-b border-white/5 uppercase tracking-wider text-[11px] font-mono select-none ${
            isActive
              ? "bg-gradient-to-r from-brand-primary/20 via-brand-secondary/10 to-transparent text-brand-neon font-bold border-l-2 border-l-brand-neon"
              : "text-text-muted hover:text-white hover:bg-white/5 border-l-2 border-l-transparent"
          }`
        }
      >
        <span className="relative flex items-center justify-center">
          <Icon size={16} />
          {item.requiresIncident && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-neon rounded-full" />
          )}
        </span>
        
        {!isSidebarCollapsed && (
          <motion.span
            variants={labelVariants}
            animate="open"
            className="font-medium whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}

        {/* Glow Active Bar */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-brand-neon to-brand-primary rounded-l opacity-0 group-[.active]:opacity-100 transition-opacity" />
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-40 cursor-default bg-black/60 backdrop-blur-sm lg:hidden transition-all"
          onClick={closeMobile}
          aria-label="Close navigation overlay"
        />
      )}

      <motion.aside
        animate={isSidebarCollapsed ? "collapsed" : "open"}
        variants={sidebarVariants}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={`
          flex h-full flex-shrink-0 flex-col justify-between
          bg-gradient-to-b from-[#070B14] to-[#0F1419]
          border-r border-white/10 relative z-40
          ${isMobile
            ? `fixed bottom-0 left-0 top-16 transform transition-transform duration-300 ease-in-out ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative translate-x-0"
          }
        `}
      >
        {/* Toggle Button for Desktop */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-brand-primary border border-white/20 text-white flex items-center justify-center hover:bg-brand-secondary transition-colors z-50 shadow-md shadow-black/50 cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}

        <div>
          {/* Brand/Logo Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 min-h-[64px]">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white border border-brand-accent/40 shadow-md flex-shrink-0">
                <Shield size={16} className="text-brand-neon animate-pulse" />
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col text-left"
                >
                  <span className="font-bold text-xs uppercase tracking-widest text-white leading-none">
                    SEC-OP AGNT
                  </span>
                  <span className="text-[9px] text-brand-neon font-mono mt-0.5 tracking-wider">
                    COGNITIVE SOC v1
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex flex-col py-3 overflow-y-auto overflow-x-hidden">
            {DASHBOARD_NAV_ITEMS.map(renderNavItem)}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile section */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-1.5">
          {/* Alerts notification shortcut */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all select-none">
            <div className="relative flex-shrink-0">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                ALERTS RUNNING
              </span>
            )}
          </div>

          {/* User profile capsule */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-brand-primary/50 border border-brand-accent/30 flex items-center justify-center text-white flex-shrink-0">
              <User size={14} className="text-brand-neon" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[10px] font-bold text-white truncate">John Doe</span>
                <span className="text-[8px] text-brand-neon font-mono uppercase tracking-wider">
                  SOC ADMIN
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;
