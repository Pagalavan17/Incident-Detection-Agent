import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Route guard shell — reserved for future auth checks.
 * Currently passes through to nested dashboard routes.
 */
export const ProtectedLayout: React.FC = () => {
  return <Outlet />;
};

export default ProtectedLayout;
