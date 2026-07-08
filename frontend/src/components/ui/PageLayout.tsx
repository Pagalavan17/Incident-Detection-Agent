import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cyber-bg-light dark:bg-cyber-bg-dark">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-cyber-bg-light dark:bg-cyber-bg-dark">
          {children}
        </main>
      </div>
    </div>
  );
};
export default PageLayout;
