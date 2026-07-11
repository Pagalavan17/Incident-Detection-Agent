import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeContextProvider } from "./context/ThemeContext";
import { HealthContextProvider } from "./context/HealthContext";
import { IncidentContextProvider } from "./context/IncidentContext";
import ProtectedLayout from "./layouts/ProtectedLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import UploadLogs from "./pages/UploadLogs";
import IncidentDetails from "./pages/IncidentDetails";
import AIDiagnosis from "./pages/AIDiagnosis";
import RootCause from "./pages/RootCause";
import Remediation from "./pages/Remediation";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Guardrails from "./pages/Guardrails";
import PostMortem from "./pages/PostMortem";
import SystemHealth from "./pages/SystemHealth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <HealthContextProvider>
        <IncidentContextProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<ProtectedLayout />}>
                <Route element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="upload" element={<UploadLogs />} />
                  <Route path="details" element={<IncidentDetails />} />
                  <Route path="diagnosis" element={<AIDiagnosis />} />
                  <Route path="root-cause" element={<RootCause />} />
                  <Route path="remediation" element={<Remediation />} />
                  <Route path="threat-intel" element={<ThreatIntelligence />} />
                  <Route path="guardrails" element={<Guardrails />} />
                  <Route path="post-mortem" element={<PostMortem />} />
                  <Route path="health" element={<SystemHealth />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </IncidentContextProvider>
      </HealthContextProvider>
    </ThemeContextProvider>
  );
};

export default App;
