import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { BREADCRUMB_LABELS } from "../../config/navigation";

export const DashboardBreadcrumb: React.FC = () => {
  const location = useLocation();
  const currentLabel = BREADCRUMB_LABELS[location.pathname];

  if (!currentLabel || location.pathname === "/") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex-shrink-0 border-b border-cyber-border-light bg-cyber-bg-light px-4 py-2 dark:border-cyber-border-dark dark:bg-cyber-bg-dark md:px-8"
    >
      <ol className="flex items-center space-x-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <li>
          <Link
            to="/"
            className="inline-flex items-center transition-colors hover:text-cyber-primary"
          >
            <Home size={12} className="mr-1" />
            Dashboard
          </Link>
        </li>
        <li className="flex items-center">
          <ChevronRight size={12} className="mx-1 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {currentLabel}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default DashboardBreadcrumb;
