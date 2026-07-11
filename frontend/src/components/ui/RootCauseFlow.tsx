import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, AlertTriangle, Cpu, Globe, Skull, ArrowRight, ArrowDown } from "lucide-react";

interface FlowNode {
  id: string;
  title: string;
  status: "degraded" | "failed" | "normal";
  icon: React.ComponentType<{ size: number; className?: string }>;
  description: string;
  metrics: string;
  tooltip: string;
}

export const RootCauseFlow: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes: FlowNode[] = [
    {
      id: "db",
      title: "Database Pool",
      status: "degraded",
      icon: Database,
      description: "Postgres RDS master pool running at 100% capacity exhaustion",
      metrics: "Active: 100/100 connections",
      tooltip: "The database thread pool has reached maximum concurrency, preventing new transactions from establishing sockets.",
    },
    {
      id: "leak",
      title: "Connection Leak",
      status: "failed",
      icon: AlertTriangle,
      description: "Socket connection leak identified in transaction handler",
      metrics: "Leak rate: +15 sockets/min",
      tooltip: "A try/catch block inside the payment transaction repository failed to release connection sockets in the finally block.",
    },
    {
      id: "payment",
      title: "Payment Service",
      status: "failed",
      icon: Cpu,
      description: "Service thread block: internal server error 500 thread lock",
      metrics: "Latency: 30000ms",
      tooltip: "The payment server is failing all calls with socket-timed-out errors, blocking order checkout routines.",
    },
    {
      id: "gateway",
      title: "API Gateway",
      status: "degraded",
      icon: Globe,
      description: "Edge rate limiting & timeout rules triggered at proxy routing",
      metrics: "Success Rate: 2%",
      tooltip: "The gateway is returning 504 Gateway Timeout responses for all billing microservice request pathways.",
    },
    {
      id: "failure",
      title: "Failure Outage",
      status: "failed",
      icon: Skull,
      description: "Customer checkout cascade failure: 100% checkout drops",
      metrics: "Checkout drops: 140/min",
      tooltip: "The critical failure has propagated to the final client interfaces, generating cart abandonment alerts.",
    },
  ];

  const getStatusStyles = (status: string) => {
    if (status === "failed") {
      return "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    }
    if (status === "degraded") {
      return "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
    }
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  };

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-glow relative text-left font-mono overflow-visible">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-brand-primary/5 to-transparent pointer-events-none rounded-2xl" />

      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Interactive Root Cause Dependency Graph
          </h3>
          <p className="text-[10px] text-text-muted mt-1 uppercase">
            Failure propagation route // Hover nodes to inspect diagnostics
          </p>
        </div>
        <span className="px-2 py-0.5 text-[9px] bg-red-500/20 border border-red-500/30 rounded text-red-400 font-bold">
          CRITICAL PATHWAY
        </span>
      </div>

      {/* Grid wrapper for nodes and connections */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-2 xl:gap-4 relative overflow-visible py-4">
        {nodes.map((node, index) => {
          const NodeIcon = node.icon;
          const isHovered = hoveredNode === node.id;

          return (
            <React.Fragment key={node.id}>
              {/* Flow Node Card */}
              <div
                className="relative flex-1 w-full lg:w-auto"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 relative z-10 ${getStatusStyles(
                    node.status
                  )}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`p-1.5 rounded-lg bg-white/5 border border-white/10`}>
                      <NodeIcon size={16} />
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase">{node.title}</h4>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-snug line-clamp-2 min-h-[30px]">
                    {node.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-text-muted uppercase">
                    <span>Telemetry Metrics</span>
                    <span className="font-bold text-white">{node.metrics}</span>
                  </div>
                </motion.div>

                {/* Hover Tooltip Modal */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: -8, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 border border-white/20 rounded-lg shadow-2xl z-20 pointer-events-none text-[11px] font-sans text-text-secondary leading-relaxed"
                    >
                      <h5 className="font-bold text-white font-mono uppercase text-[10px] border-b border-white/5 pb-1 mb-1.5">
                        Deep Diagnostics
                      </h5>
                      {node.tooltip}
                      {/* Arrow tail */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/20 rotate-45 -mt-1.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Connector Arrows (hide on final index) */}
              {index < nodes.length - 1 && (
                <div className="flex items-center justify-center py-2 lg:py-0 select-none">
                  {/* Down arrow on mobile, Right arrow on desktop */}
                  <span className="hidden lg:inline text-brand-neon animate-pulse">
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight size={18} />
                    </motion.div>
                  </span>
                  <span className="inline lg:hidden text-brand-neon animate-pulse">
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowDown size={18} />
                    </motion.div>
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default RootCauseFlow;
