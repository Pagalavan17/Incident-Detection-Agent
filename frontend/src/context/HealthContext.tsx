import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { apiGetReady } from "../api/client";
import type { ServiceStatus } from "../api/types";

interface HealthContextProps {
  status: "ok" | "degraded" | "loading";
  services: ServiceStatus[];
  lastChecked: string;
  error: string | null;
  refreshHealth: () => Promise<void>;
}

const HealthContext = createContext<HealthContextProps | undefined>(undefined);

export const HealthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<"ok" | "degraded" | "loading">("loading");
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const refreshHealth = async () => {
    try {
      const data = await apiGetReady();
      setStatus(data.status);
      setServices(data.services);
      setLastChecked(data.timestamp || new Date().toISOString());
      setError(null);
    } catch (err: any) {
      setStatus("degraded");
      setError(err.message || "Failed to fetch backend health status");
      // Set default service status as degraded when connection fails completely
      setServices([
        { name: "qdrant", status: "degraded", message: "Connection failed" },
        { name: "anthropic", status: "degraded", message: "Connection failed" },
        { name: "openai", status: "degraded", message: "Connection failed" },
        { name: "enkrypt", status: "degraded", message: "Connection failed" },
      ]);
      setLastChecked(new Date().toISOString());
    }
  };

  useEffect(() => {
    // Initial health check
    refreshHealth();

    // 30 seconds polling interval
    pollingRef.current = setInterval(refreshHealth, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return (
    <HealthContext.Provider value={{ status, services, lastChecked, error, refreshHealth }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthContextProvider");
  }
  return context;
};
