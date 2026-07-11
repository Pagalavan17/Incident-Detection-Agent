import React, { createContext, useContext, useState } from "react";
import { apiAnalyze, apiRootCause, apiRemediation, apiGuardrails, apiPostmortem } from "../api/client";
import type { CompleteIncidentResponse } from "../api/types";

interface IncidentContextProps {
  currentIncident: CompleteIncidentResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeLogs: (logs: Record<string, unknown>[]) => Promise<CompleteIncidentResponse>;
  retryAnalysis: () => Promise<CompleteIncidentResponse | void>;
  clearIncident: () => void;
  generateRootCause: () => Promise<void>;
  generateRemediation: () => Promise<void>;
  generateGuardrails: () => Promise<void>;
  generatePostMortem: () => Promise<void>;
}

const IncidentContext = createContext<IncidentContextProps | undefined>(undefined);

export const IncidentContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentIncident, setCurrentIncident] = useState<CompleteIncidentResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLogs, setLastLogs] = useState<Record<string, unknown>[] | null>(null);

  const analyzeLogs = async (logs: Record<string, unknown>[]): Promise<CompleteIncidentResponse> => {
    setLastLogs(logs);
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await apiAnalyze(logs);
      if (response.success && response.data) {
        setCurrentIncident(response.data);
        setIsAnalyzing(false);
        return response.data;
      } else {
        throw new Error("Analysis completed but did not return data");
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to analyze log payload";
      setError(errMsg);
      setIsAnalyzing(false);
      throw err;
    }
  };

  const clearIncident = () => {
    setCurrentIncident(null);
    setError(null);
    setIsAnalyzing(false);
    setLastLogs(null);
  };

  const retryAnalysis = async () => {
    if (lastLogs) {
      return analyzeLogs(lastLogs);
    }
    return Promise.resolve();
  };

  const generateRootCause = async () => {
    if (!currentIncident) {
      throw new Error("No active incident session");
    }

    console.group("Root Cause Analysis");
    console.log("Request:", currentIncident.incident);

    try {
      const retrievalResult = {
        queryIncidentId: currentIncident.incident.id,
        matches: currentIncident.historicalMatches || [],
        searchedAt: new Date().toISOString()
      };
      
      const res = await apiRootCause(currentIncident.incident, retrievalResult);
      console.log("Response:", res);

      if (!res.success) {
        throw new Error((res as any).error || "Root Cause generation failed");
      }

      if (!res.data || !res.data.rootCause) {
        throw new Error("Invalid backend response.");
      }

      setCurrentIncident(prev =>
        prev
          ? {
            ...prev,
            rootCause: res.data.rootCause,
          }
          : prev
      );
    } catch (err: any) {
      console.error("Root Cause Error:", err);
      throw err;
    } finally {
      console.groupEnd();
    }
  };

  const generateRemediation = async () => {
    if (!currentIncident) {
      throw new Error("No active incident session");
    }
    if (!currentIncident.rootCause) {
      throw new Error("Cannot generate remediation: Missing root cause");
    }

    console.group("Remediation");
    console.log("Request:", currentIncident.incident);

    try {
      const res = await apiRemediation(currentIncident.incident, currentIncident.rootCause);
      console.log("Response:", res);

      if (!res.success) {
        throw new Error((res as any).error || "Remediation generation failed");
      }

      if (!res.data || !res.data.remediation) {
        throw new Error("Invalid backend response.");
      }

      setCurrentIncident(prev =>
        prev
          ? {
            ...prev,
            remediation: res.data.remediation,
          }
          : prev
      );
    } catch (err: any) {
      console.error("Remediation Error:", err);
      throw err;
    } finally {
      console.groupEnd();
    }
  };

  const generateGuardrails = async () => {
    if (!currentIncident) {
      throw new Error("No active incident session");
    }
    if (!currentIncident.rootCause) {
      throw new Error("Cannot generate guardrails: Missing root cause");
    }
    if (!currentIncident.remediation) {
      throw new Error("Cannot generate guardrails: Missing remediation");
    }

    console.group("Guardrails");
    console.log("Request:", currentIncident.incident);

    try {
      const res = await apiGuardrails(currentIncident.incident, currentIncident.rootCause, currentIncident.remediation);
      console.log("Response:", res);

      if (!res.success) {
        throw new Error((res as any).error || "Guardrails generation failed");
      }

      if (!res.data || !res.data.guardrails) {
        throw new Error("Invalid backend response.");
      }

      setCurrentIncident(prev =>
        prev
          ? {
            ...prev,
            guardrails: res.data.guardrails,
          }
          : prev
      );
    } catch (err: any) {
      console.error("Guardrails Error:", err);
      throw err;
    } finally {
      console.groupEnd();
    }
  };

  const generatePostMortem = async () => {
    if (!currentIncident) {
      throw new Error("No active incident session");
    }
    if (!currentIncident.rootCause) {
      throw new Error("Cannot generate post-mortem: Missing root cause");
    }
    if (!currentIncident.remediation) {
      throw new Error("Cannot generate post-mortem: Missing remediation");
    }
    if (!currentIncident.guardrails) {
      throw new Error("Cannot generate post-mortem: Missing guardrails");
    }

    console.group("Post Mortem");
    console.log("Request:", currentIncident.incident);

    try {
      const res = await apiPostmortem(currentIncident.incident, currentIncident.rootCause, currentIncident.remediation, currentIncident.guardrails);
      console.log("Response:", res);

      if (!res.success) {
        throw new Error((res as any).error || "Post Mortem generation failed");
      }

      if (!res.data || !res.data.postMortem) {
        throw new Error("Invalid backend response.");
      }

      setCurrentIncident(prev =>
        prev
          ? {
            ...prev,
            postMortem: res.data.postMortem,
          }
          : prev
      );
    } catch (err: any) {
      console.error("Post Mortem Error:", err);
      throw err;
    } finally {
      console.groupEnd();
    }
  };
  return (
    <IncidentContext.Provider
      value={{
        currentIncident,
        isAnalyzing,
        error,
        analyzeLogs,
        retryAnalysis,
        clearIncident,
        generateRootCause,
        generateRemediation,
        generateGuardrails,
        generatePostMortem,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncident must be used within an IncidentContextProvider");
  }
  return context;
};
