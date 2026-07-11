import React from "react";
import { motion } from "framer-motion";
import { THEME } from "../../styles/theme";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glowing?: boolean;
  variant?: "light" | "medium" | "dark";
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hover = true,
  glowing = false,
  variant = "light",
  onClick,
}) => {
  const variantStyles = {
    light: THEME.glass.light,
    medium: THEME.glass.medium,
    dark: THEME.glass.dark,
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        rounded-xl p-6 transition-all duration-300
        ${variantStyles[variant]}
        ${hover ? "cursor-pointer hover:border-white/20" : ""}
        ${glowing ? "animate-glow" : ""}
        ${className}
      `}
      style={glowing ? { boxShadow: THEME.shadow.glow } : {}}
    >
      {children}
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  variant?: "primary" | "success" | "warning" | "danger";
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  trend = "neutral",
  variant = "primary",
}) => {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  const variantColors = {
    primary: "text-brand-accent",
    success: "text-green-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };

  const trendText = change ? (trend === "up" ? "↑" : "↓") : "";

  return (
    <GlassCard hover>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-2xl opacity-75 ${variantColors[variant]}`}>{icon}</div>
          {change !== undefined && (
            <span className={`text-xs font-semibold ${trendColors[trend]}`}>
              {trendText} {Math.abs(change)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
};

interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info" | "critical";
  label: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon,
}) => {
  const statusColors = {
    success: "bg-green-500/20 text-green-300 border-green-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    critical: "bg-red-600/20 text-red-200 border-red-600/30",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full
        text-xs font-semibold border
        ${statusColors[status]}
      `}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
};

interface SeverityBadgeProps {
  severity: "critical" | "high" | "medium" | "low" | "info";
  label?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  label,
}) => {
  const severityStyles = {
    critical:
      "bg-red-600/20 text-red-200 border-red-600/30 shadow-lg shadow-red-600/20",
    high: "bg-red-500/20 text-red-300 border-red-500/30",
    medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    low: "bg-green-500/20 text-green-300 border-green-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  const severityLabels = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
    info: "INFO",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
        text-xs font-bold border
        ${severityStyles[severity]}
      `}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {label || severityLabels[severity]}
    </div>
  );
};

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = "h-12",
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} skeleton rounded-lg`}
        />
      ))}
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <GlassCard>
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="text-5xl opacity-50">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </h3>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg text-sm font-semibold transition-all duration-200"
          >
            {action.label}
          </button>
        )}
      </div>
    </GlassCard>
  );
};

export * from "./AIChat";
export * from "./PipelineCard";
export * from "./RootCauseFlow";
export * from "./LogViewer";
