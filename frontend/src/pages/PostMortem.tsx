import React from "react";
import { useIncident } from "../context/IncidentContext";
import EmptyState from "../components/ui/EmptyState";
import PostMortemViewer from "../components/analysis/PostMortemViewer";
import SeverityBadge from "../components/incident/SeverityBadge";
import StatusChip from "../components/incident/StatusChip";

export const PostMortem: React.FC = () => {
  const { currentIncident } = useIncident();

  if (!currentIncident) {
    return <EmptyState />;
  }

  const postMortemData = currentIncident.postMortem;

  if (!postMortemData) {
    return (
      <EmptyState
        title="Post-Mortem Report Missing"
        description="Post-Mortem generation step was not executed or failed for this incident session."
        actionText="UPLOAD NEW LOG BATCH"
      />
    );
  }

  return (
    <div className="space-y-6 font-mono text-left max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border-light dark:border-cyber-border-dark pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
            Post-Mortem Archives
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase">
            Formally compiled reports of incident failures and recurrence preventions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SeverityBadge severity={currentIncident.incident.severity} />
          <StatusChip status={currentIncident.incident.lifecycle} />
        </div>
      </div>

      <PostMortemViewer report={postMortemData} />
    </div>
  );
};
export default PostMortem;
