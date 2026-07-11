import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

interface ModernNavbarProps {
  isDark?: boolean;
  onThemeToggle?: () => void;
}

export const ModernNavbar: React.FC<ModernNavbarProps> = ({
  isDark = true,
  onThemeToggle,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationCount] = useState(3);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        fixed top-0 right-0 left-0 ml-20 md:ml-20 lg:ml-[280px]
        h-20 px-6 py-4 z-30
        bg-gradient-to-r from-[#070B14]/80 to-[#0F1419]/80
        backdrop-blur-xl border-b border-white/10
        flex items-center justify-between
        transition-all duration-300
      "
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <motion.div
          animate={isSearchFocused ? { scale: 1.02 } : { scale: 1 }}
          className="
            relative flex items-center gap-3 px-4 py-2.5
            bg-white/5 border border-white/10 rounded-lg
            hover:border-white/20 hover:bg-white/8
            transition-all duration-200
            focus-within:border-brand-primary/50 focus-within:bg-white/10
          "
        >
          <Search size={18} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search logs, incidents..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="
              flex-1 bg-transparent outline-none text-sm
              placeholder-text-dim
            "
          />
          {isSearchFocused && (
            <span className="text-xs text-text-muted">⌘K</span>
          )}
        </motion.div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-8">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="
            relative p-2 rounded-lg
            hover:bg-white/10 transition-all duration-200
          "
        >
          <Bell size={20} className="text-text-secondary" />
          {notificationCount > 0 && (
            <span className="
              absolute top-1 right-1 w-5 h-5
              bg-red-500 text-white text-xs font-bold
              rounded-full flex items-center justify-center
              animate-pulse
            ">
              {notificationCount}
            </span>
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onThemeToggle}
          className="
            p-2 rounded-lg
            hover:bg-white/10 transition-all duration-200
          "
        >
          {isDark ? (
            <Sun size={20} className="text-text-secondary" />
          ) : (
            <Moon size={20} className="text-text-secondary" />
          )}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="
            p-2 rounded-lg
            hover:bg-white/10 transition-all duration-200
          "
        >
          <Settings size={20} className="text-text-secondary" />
        </motion.button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Profile Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              hover:bg-white/10 transition-all duration-200
            "
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">JD</span>
            </div>
            <span className="hidden md:block text-sm font-medium">
              John Doe
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </motion.button>

          {/* Profile Menu */}
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="
                absolute top-full right-0 mt-2 w-48
                bg-[#111827] border border-white/20 rounded-lg
                backdrop-blur-xl
                shadow-xl
              "
            >
              <div className="p-2 space-y-1">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-semibold text-text-primary">
                    John Doe
                  </p>
                  <p className="text-xs text-text-muted">Security Admin</p>
                </div>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all">
                  <User size={16} />
                  Profile
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-all">
                  <Settings size={16} />
                  Settings
                </button>
                <div className="border-t border-white/10 my-1" />
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-all">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default ModernNavbar;
