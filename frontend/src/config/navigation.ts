import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Compass,
  FileCode,
  ShieldCheck,
  FileQuestion,
  Activity,
  Zap,
  ShieldAlert,
  Settings,
} from "lucide-react";

export type NavItemId =
  | "dashboard"
  | "upload"
  | "details"
  | "diagnosis"
  | "root-cause"
  | "remediation"
  | "threat-intel"
  | "guardrails"
  | "post-mortem"
  | "health"
  | "settings";

export interface DashboardNavItem {
  readonly id: NavItemId;
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly requiresIncident: boolean;
  readonly lockedTitle?: string;
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    id: "dashboard",
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiresIncident: false,
  },
  {
    id: "upload",
    to: "/upload",
    label: "Upload Logs",
    icon: UploadCloud,
    requiresIncident: false,
  },
  {
    id: "details",
    to: "/details",
    label: "Incident Reports",
    icon: FileText,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view incident reports",
  },
  {
    id: "diagnosis",
    to: "/diagnosis",
    label: "AI Diagnosis",
    icon: Zap,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view AI diagnosis cockpit",
  },
  {
    id: "root-cause",
    to: "/root-cause",
    label: "Root Cause Analysis",
    icon: Compass,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view Root Cause Analysis",
  },
  {
    id: "remediation",
    to: "/remediation",
    label: "Remediation",
    icon: FileCode,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view Remediation",
  },
  {
    id: "threat-intel",
    to: "/threat-intel",
    label: "Threat Intelligence",
    icon: ShieldAlert,
    requiresIncident: false,
  },
  {
    id: "guardrails",
    to: "/guardrails",
    label: "Guardrails",
    icon: ShieldCheck,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view Guardrails",
  },
  {
    id: "post-mortem",
    to: "/post-mortem",
    label: "Post-Mortem Reports",
    icon: FileQuestion,
    requiresIncident: true,
    lockedTitle: "Upload logs first to view Post-Mortem",
  },
  {
    id: "health",
    to: "/health",
    label: "System Health",
    icon: Activity,
    requiresIncident: false,
  },
  {
    id: "settings",
    to: "/settings",
    label: "Settings",
    icon: Settings,
    requiresIncident: false,
  },
] as const;

export const BREADCRUMB_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/upload": "Upload Logs",
  "/details": "Incident Reports",
  "/diagnosis": "AI Diagnosis",
  "/root-cause": "Root Cause Analysis",
  "/remediation": "Remediation",
  "/threat-intel": "Threat Intelligence",
  "/guardrails": "Guardrails",
  "/post-mortem": "Post-Mortem Reports",
  "/health": "System Health",
  "/settings": "Settings",
};
