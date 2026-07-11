import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../context/SidebarContext";
import DashboardHeader from "../components/layout/DashboardHeader";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardBreadcrumb from "../components/layout/DashboardBreadcrumb";
import QdrantWarningBanner from "../components/ui/QdrantWarningBanner";

export const DashboardLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[#070B14] text-white">
        <QdrantWarningBanner />
        <DashboardHeader />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardSidebar />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardBreadcrumb />
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#070B14] via-[#0F1419] to-[#070B14] p-4 md:p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
