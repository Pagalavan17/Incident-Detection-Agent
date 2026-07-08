import React from "react";
import { ShieldX, CornerDownLeft } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-6 font-mono text-left">
      <div className="cyber-panel p-8 text-center space-y-6 max-w-md w-full bg-cyber-panel-light dark:bg-cyber-panel-dark">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
          <ShieldX size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500">
            ERROR: ROUTE_NOT_FOUND (404)
          </h2>
          <p className="text-xs font-sans text-slate-500 dark:text-slate-400 leading-relaxed">
            The resource scope or page address you requested is not indexed in the router configuration.
          </p>
        </div>
        <RouterLink
          to="/"
          className="w-full flex items-center justify-center py-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white font-bold tracking-widest text-[10px] uppercase border border-cyber-primary cursor-pointer transition-all"
        >
          <CornerDownLeft size={12} className="mr-2" />
          Return to Cockpit Dashboard
        </RouterLink>
      </div>
    </div>
  );
};
export default NotFound;
