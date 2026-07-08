import React, { createContext, useContext, useState } from "react";
import { apiAnalyze } from "../api/client";
import type { CompleteIncidentResponse } from "../api/types";

interface IncidentContextProps {
  currentIncident: CompleteIncidentResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeLogs: (logs: Record<string, unknown>[]) => Promise<CompleteIncidentResponse>;
  clearIncident: () => void;
}

const IncidentContext = createContext<IncidentContextProps | undefined>(undefined);

export const IncidentContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentIncident, setCurrentIncident] = useState<CompleteIncidentResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLogs = async (logs: Record<string, unknown>[]): Promise<CompleteIncidentResponse> => {
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
  };

  return (
    <IncidentContext.Provider
      value={{
        currentIncident,
        isAnalyzing,
        error,
        analyzeLogs,
        clearIncident,
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
