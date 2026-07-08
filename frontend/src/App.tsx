import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeContextProvider } from "./context/ThemeContext";
import { HealthContextProvider } from "./context/HealthContext";
import { IncidentContextProvider } from "./context/IncidentContext";
import PageLayout from "./components/ui/PageLayout";

// Import Pages
import Dashboard from "./pages/Dashboard";
import UploadLogs from "./pages/UploadLogs";
import IncidentDetails from "./pages/IncidentDetails";
import RootCause from "./pages/RootCause";
import Remediation from "./pages/Remediation";
import Guardrails from "./pages/Guardrails";
import PostMortem from "./pages/PostMortem";
import SystemHealth from "./pages/SystemHealth";
import NotFound from "./pages/NotFound";

export const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <HealthContextProvider>
        <IncidentContextProvider>
          <BrowserRouter>
            <PageLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<UploadLogs />} />
                <Route path="/details" element={<IncidentDetails />} />
                <Route path="/root-cause" element={<RootCause />} />
                <Route path="/remediation" element={<Remediation />} />
                <Route path="/guardrails" element={<Guardrails />} />
                <Route path="/post-mortem" element={<PostMortem />} />
                <Route path="/health" element={<SystemHealth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageLayout>
          </BrowserRouter>
        </IncidentContextProvider>
      </HealthContextProvider>
    </ThemeContextProvider>
  );
};

export default App;
