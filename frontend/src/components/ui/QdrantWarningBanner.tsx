import React from "react";
import { useHealth } from "../../context/HealthContext";
import { AlertOctagon, Terminal } from "lucide-react";

export const QdrantWarningBanner: React.FC = () => {
  const { status, services } = useHealth();
  
  if (status !== "degraded") return null;
  
  const qdrantDegraded = services.find(s => s.name === "qdrant" && s.status === "degraded");
  
  if (!qdrantDegraded) return null;

  return (
    <div className="bg-orange-950/40 border-b border-orange-900/60 p-3 flex flex-col sm:flex-row items-center justify-between font-mono z-50">
      <div className="flex items-start sm:items-center space-x-3 mb-2 sm:mb-0">
        <div className="p-1.5 bg-orange-900/40 text-orange-400 rounded">
          <AlertOctagon size={18} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            Warning: Vector Database Offline
          </h4>
          <p className="text-[11px] text-orange-300 font-sans mt-0.5 max-w-xl">
            Qdrant is unreachable. Historical correlations and RAG features are currently degraded, but the app will not crash.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 bg-black/40 border border-orange-900/40 px-3 py-1.5 rounded-lg whitespace-nowrap">
        <Terminal size={12} className="text-orange-500" />
        <code className="text-[10px] text-orange-200">docker-compose up -d</code>
      </div>
    </div>
  );
};

export default QdrantWarningBanner;
