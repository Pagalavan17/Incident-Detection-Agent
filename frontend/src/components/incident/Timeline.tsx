import React from "react";
import type { CompleteIncidentResponse } from "../../api/types";
import { Clock } from "lucide-react";

interface TimelineProps {
  incidentData: CompleteIncidentResponse;
}

export const Timeline: React.FC<TimelineProps> = ({ incidentData }) => {
  const getTimeline = () => {
    // If post-mortem draft timeline exists, use it
    if (incidentData.incident.postMortemDraft?.timeline?.length) {
      return incidentData.incident.postMortemDraft.timeline;
    }
    // Otherwise construct a fallback timeline from the core events
    return [
      {
        timestamp: incidentData.incident.detectedAt,
        description: `Anomaly signal DETECTED: "${incidentData.incident.signal.description}"`,
        actor: "SYSTEM" as const,
      },
      {
        timestamp: incidentData.incident.updatedAt,
        description: `Incident initialized in TRIAGING state. Ingestion meta verified.`,
        actor: "SYSTEM" as const,
      },
    ];
  };

  const timeline = getTimeline();

  const actorBadges = {
    SYSTEM: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    AUTO_REMEDIATION: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    ON_CALL_ENGINEER: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  };

  return (
    <div className="bg-cyber-panel-light dark:bg-cyber-panel-dark border border-cyber-border-light dark:border-cyber-border-dark p-6 font-mono text-left">
      <h3 className="text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 uppercase mb-6 border-b border-cyber-border-light dark:border-cyber-border-dark pb-2">
        Operational Event Timeline
      </h3>
      <div className="space-y-6">
        {timeline.map((event, idx) => (
          <div key={idx} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-0.5 text-slate-400 dark:text-slate-600">
              <Clock size={16} />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
                <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded-none ${actorBadges[event.actor] || actorBadges.SYSTEM}`}>
                  {event.actor}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-1.5 border-l-2 border-cyber-border-light dark:border-cyber-border-dark pl-3">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Timeline;
