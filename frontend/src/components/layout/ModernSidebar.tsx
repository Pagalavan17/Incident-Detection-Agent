import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Compass,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  to: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { id: "upload", label: "Upload Logs", icon: Upload, to: "/upload" },
  { id: "incidents", label: "Incident Reports", icon: FileText, to: "/incidents" },
  { id: "diagnosis", label: "AI Diagnosis", icon: Zap, to: "/diagnosis" },
  { id: "root-cause", label: "Root Cause", icon: Compass, to: "/root-cause" },
  { id: "remediation", label: "Remediation", icon: AlertTriangle, to: "/remediation" },
  { id: "guardrails", label: "Guardrails", icon: ShieldCheck, to: "/guardrails" },
  { id: "settings", label: "Settings", icon: Settings, to: "/settings" },
];

export const ModernSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const sidebarVariants = {
    open: { width: "280px" },
    closed: { width: "80px" },
  };

  const labelVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
  };

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="
        fixed left-0 top-0 h-screen
        bg-gradient-to-b from-[#0F1419] to-[#070B14]
        border-r border-white/10
        flex flex-col
        z-40
      "
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        {isOpen && (
          <motion.div
            variants={labelVariants}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">AI</span>
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">
              IRA
            </span>
          </motion.div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `
                relative flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group
                ${
                  isActive
                    ? "bg-gradient-to-r from-brand-primary/30 to-brand-secondary/20 text-brand-accent border border-brand-primary/30"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }
              `
              }
            >
              <Icon size={20} />
              <motion.span
                variants={labelVariants}
                animate={isOpen ? "open" : "closed"}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {item.label}
              </motion.span>
              {item.badge && (
                <motion.span
                  variants={labelVariants}
                  animate={isOpen ? "open" : "closed"}
                  className="ml-auto px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full"
                >
                  {item.badge}
                </motion.span>
              )}
              {/* Active indicator */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-primary to-brand-secondary rounded-l opacity-0 group-[.active]:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Footer */}
      <div className="p-3 space-y-2 border-t border-white/10">
        {/* Notifications */}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-200 group relative">
          <Bell size={20} />
          <motion.span
            variants={labelVariants}
            animate={isOpen ? "open" : "closed"}
            className="text-sm font-medium"
          >
            Alerts
          </motion.span>
          <div className="absolute w-2 h-2 bg-red-500 rounded-full top-2 right-2 animate-pulse" />
        </button>

        {/* Profile */}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-200 group">
          <User size={20} className="text-brand-accent" />
          <motion.span
            variants={labelVariants}
            animate={isOpen ? "open" : "closed"}
            className="text-sm font-medium"
          >
            Admin
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
};

export default ModernSidebar;
