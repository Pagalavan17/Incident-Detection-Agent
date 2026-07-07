import { Mastra } from "@mastra/core";
import { IncidentAnalysisWorkflow } from "./workflows/incident-analysis.workflow"

export const mastra = new Mastra({
  workflows: {
    IncidentAnalysisWorkflow,
  },
});
