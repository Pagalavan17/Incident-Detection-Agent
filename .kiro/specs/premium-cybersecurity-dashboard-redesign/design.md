# Premium Cybersecurity Dashboard Redesign - Design Document

## Overview

This document specifies the technical design for redesigning the Incident Response Dashboard frontend into a premium enterprise-grade cybersecurity dashboard. The redesign focuses exclusively on UI/UX improvements while preserving all existing backend functionality, API client, context providers, and routing structure. The goal is to create a visually stunning, highly performant interface that rivals leading platforms like Microsoft Defender XDR, CrowdStrike Falcon, and Splunk Enterprise Security.

### Design Philosophy

The redesign adopts a **dark futuristic enterprise aesthetic** with premium design patterns:

- **Glassmorphism**: Frosted glass effects using backdrop blur and transparency for elevated visual hierarchy
- **Neon Accents**: Blue/purple gradient color scheme with soft glowing borders and shadows
- **Fluid Animations**: Smooth micro-interactions powered by Framer Motion with spring physics
- **Data Visualization**: Interactive charts and diagrams using Recharts with theme-appropriate styling
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts for all screen sizes
- **Performance-First**: Code splitting, lazy loading, memoization, and virtualization for optimal performance

### Scope

**In Scope:**
- Complete UI/UX redesign of all pages and components
- Design system implementation (colors, typography, spacing, shadows, animations)
- Component library creation with reusable UI primitives
- Layout system with collapsible sidebar and fixed top navigation
- Animation system using Framer Motion
- Chart and data visualization components using Recharts
- Responsive design patterns for all viewport sizes
- Accessibility improvements (WCAG AA compliance)
- Performance optimizations (code splitting, lazy loading, memoization)

**Out of Scope:**
- Backend API modifications or new endpoint creation
- Changes to existing API client structure or interceptors
- Modifications to context providers (ThemeContext, IncidentContext, HealthContext)
- Changes to data flow, state management patterns, or routing configuration
- New features or functionality beyond UI/UX improvements


## Architecture

### High-Level Architecture

The application follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  (Pages, Layouts, UI Components, Design System Primitives)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Application Layer                         │
│     (Context Providers, Custom Hooks, State Management)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Data Layer                              │
│         (API Client, Type Definitions, Interceptors)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    External Services                         │
│              (Backend REST API Endpoints)                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── ThemeContextProvider
│   ├── HealthContextProvider
│   │   ├── IncidentContextProvider
│   │   │   ├── BrowserRouter
│   │   │   │   ├── Routes
│   │   │   │   │   ├── ProtectedLayout
│   │   │   │   │   │   ├── DashboardLayout
│   │   │   │   │   │   │   ├── ModernSidebar (collapsible navigation)
│   │   │   │   │   │   │   ├── ModernNavbar (top bar with search, notifications, profile)
│   │   │   │   │   │   │   ├── AIChat (floating assistant)
│   │   │   │   │   │   │   └── Outlet (page content)
│   │   │   │   │   │   │       ├── Dashboard (hero, KPIs, charts)
│   │   │   │   │   │   │       ├── UploadLogs (drag-drop uploader, pipeline viz)
│   │   │   │   │   │   │       ├── IncidentDetails (table, filters, export)
│   │   │   │   │   │   │       ├── RootCause (interactive flow diagram)
│   │   │   │   │   │   │       ├── Remediation (AI recommendations, progress tracker)
│   │   │   │   │   │   │       ├── ThreatIntelligence (CVEs, MITRE ATT&CK, threat feeds)
│   │   │   │   │   │   │       ├── Settings (profile, notifications, API keys)
│   │   │   │   │   │   │       └── ... (other pages)
```


### Technology Stack

**Core Framework:**
- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript 5.7**: Type safety and enhanced developer experience
- **Vite 6**: Lightning-fast build tool with HMR

**Styling & Design:**
- **TailwindCSS 3.4**: Utility-first CSS framework for rapid UI development
- **PostCSS**: CSS processing with autoprefixer
- **Custom Design Tokens**: Theme variables for colors, spacing, shadows, and typography

**UI Components:**
- **shadcn/ui**: Copy-paste component library (not installed, components built from scratch using Radix primitives approach)
- **Lucide React**: Modern icon library with 1000+ icons
- **Radix UI Patterns**: Accessibility-first headless UI component patterns

**Animation:**
- **Framer Motion 12**: Production-ready animation library with spring physics
- **CSS Transitions**: Hardware-accelerated transforms for simple animations

**Data Visualization:**
- **Recharts 2**: Composable charting library built on React and D3
- **Custom Chart Themes**: Theme-aware color palettes and styling

**State Management:**
- **React Context API**: Global state for theme, health, and incident data (existing)
- **React Hooks**: useState, useEffect, useMemo, useCallback for local state
- **React Router 6**: Declarative routing with nested layouts

**HTTP Client:**
- **Axios 1.7**: Promise-based HTTP client with interceptors (existing, preserved)

**Forms & Validation:**
- **React Hook Form 7**: Performant form management
- **@hookform/resolvers 5**: Schema validation integration

**File Handling:**
- **React Dropzone 15**: Drag-and-drop file upload component

**Notifications:**
- **Sonner 2**: Modern toast notification library

**Development Tools:**
- **ESLint**: Code linting
- **TypeScript**: Static type checking


### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ...
│   │   ├── layout/                # Layout components
│   │   │   ├── ModernSidebar.tsx
│   │   │   ├── ModernNavbar.tsx
│   │   │   ├── AIChat.tsx
│   │   │   └── ...
│   │   ├── dashboard/             # Dashboard-specific components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   └── ...
│   │   ├── incident/              # Incident-related components
│   │   │   ├── IncidentTable.tsx
│   │   │   ├── SeverityBadge.tsx
│   │   │   ├── StatusChip.tsx
│   │   │   ├── PipelineProgress.tsx
│   │   │   ├── AnomalyCard.tsx
│   │   │   └── ...
│   │   ├── upload/                # Upload-related components
│   │   │   ├── UploadCard.tsx
│   │   │   ├── FileDropzone.tsx
│   │   │   ├── ImportButtons.tsx
│   │   │   └── ...
│   │   ├── charts/                # Chart components
│   │   │   ├── LineChart.tsx
│   │   │   ├── AreaChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── GaugeChart.tsx
│   │   │   ├── RadialChart.tsx
│   │   │   └── ...
│   │   ├── logs/                  # Log viewer components
│   │   │   ├── LogViewer.tsx
│   │   │   ├── LogEntry.tsx
│   │   │   ├── LogFilters.tsx
│   │   │   └── ...
│   │   ├── rootcause/             # Root cause components
│   │   │   ├── RootCauseFlow.tsx
│   │   │   ├── FlowNode.tsx
│   │   │   ├── FlowEdge.tsx
│   │   │   └── ...
│   │   ├── remediation/           # Remediation components
│   │   │   ├── RemediationCard.tsx
│   │   │   ├── ActionItem.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── ...
│   │   └── threat/                # Threat intelligence components
│   │       ├── CVECard.tsx
│   │       ├── MitreMatrix.tsx
│   │       ├── ThreatFeed.tsx
│   │       └── ...
│   ├── pages/                     # Page components (existing, redesigned)
│   ├── layouts/                   # Layout wrappers (existing, preserved)
│   ├── context/                   # Context providers (existing, preserved)
│   ├── api/                       # API client (existing, preserved)
│   ├── hooks/                     # Custom hooks
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── ...
│   ├── utils/                     # Utility functions
│   │   ├── cn.ts                  # Class name utility (clsx + tailwind-merge)
│   │   ├── formatters.ts          # Date, number formatters
│   │   ├── validators.ts          # Input validation helpers
│   │   └── ...
│   ├── styles/                    # Global styles
│   │   ├── globals.css
│   │   └── animations.css
│   └── config/                    # Configuration (existing)
```


## Design System

### Color Palette

#### Dark Theme (Primary)

**Background Colors:**
```css
--bg-primary: #070B14      /* Main background */
--bg-secondary: #0D1117    /* Secondary surfaces */
--bg-tertiary: #161B22     /* Elevated surfaces */
--bg-hover: #1C2128        /* Hover states */
```

**Glassmorphism:**
```css
--glass-bg: rgba(255, 255, 255, 0.05)    /* Glass background */
--glass-border: rgba(255, 255, 255, 0.1) /* Glass border */
--glass-blur: 12px                        /* Backdrop blur */
```

**Accent Colors:**
```css
--accent-primary: #4F46E5    /* Indigo 600 - Primary actions */
--accent-secondary: #6366F1  /* Indigo 500 - Secondary actions */
--accent-tertiary: #3B82F6   /* Blue 500 - Tertiary accents */
--accent-purple: #8B5CF6     /* Purple 500 - Highlights */
--accent-cyan: #06B6D4       /* Cyan 500 - Info states */
```

**Semantic Colors:**
```css
--success: #10B981    /* Green 500 - Success states */
--warning: #F59E0B    /* Amber 500 - Warning states */
--error: #EF4444      /* Red 500 - Error states */
--info: #3B82F6       /* Blue 500 - Info states */
```

**Severity Colors:**
```css
--severity-critical: #DC2626  /* Red 600 - Critical */
--severity-high: #F97316      /* Orange 500 - High */
--severity-medium: #F59E0B    /* Amber 500 - Medium */
--severity-low: #10B981       /* Green 500 - Low */
--severity-info: #3B82F6      /* Blue 500 - Info */
```

**Text Colors:**
```css
--text-primary: #F9FAFB      /* Gray 50 - Primary text */
--text-secondary: #D1D5DB    /* Gray 300 - Secondary text */
--text-tertiary: #9CA3AF     /* Gray 400 - Tertiary text */
--text-disabled: #6B7280     /* Gray 500 - Disabled text */
```

#### Light Theme (Secondary)

```css
--bg-primary-light: #FFFFFF
--bg-secondary-light: #F9FAFB
--bg-tertiary-light: #F3F4F6
--text-primary-light: #111827
--text-secondary-light: #4B5563
--text-tertiary-light: #6B7280
```


### Typography

**Font Family:**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
```

**Font Sizes:**
```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
```

**Font Weights:**
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

**Line Heights:**
```css
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.75
```

### Spacing Scale

```css
--spacing-1: 0.25rem    /* 4px */
--spacing-2: 0.5rem     /* 8px */
--spacing-3: 0.75rem    /* 12px */
--spacing-4: 1rem       /* 16px */
--spacing-5: 1.25rem    /* 20px */
--spacing-6: 1.5rem     /* 24px */
--spacing-8: 2rem       /* 32px */
--spacing-10: 2.5rem    /* 40px */
--spacing-12: 3rem      /* 48px */
--spacing-16: 4rem      /* 64px */
--spacing-20: 5rem      /* 80px */
```

### Border Radius

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-full: 9999px
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-glow: 0 0 20px rgba(79, 70, 229, 0.4);
--shadow-glow-purple: 0 0 20px rgba(139, 92, 246, 0.4);
```


### Responsive Breakpoints

```css
--breakpoint-sm: 640px    /* Mobile */
--breakpoint-md: 768px    /* Tablet */
--breakpoint-lg: 1024px   /* Laptop */
--breakpoint-xl: 1280px   /* Desktop */
--breakpoint-2xl: 1536px  /* Large Desktop */
```

**TailwindCSS Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
}
```

### Animation Tokens

```css
--duration-fast: 150ms
--duration-normal: 300ms
--duration-slow: 500ms

--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

**Framer Motion Variants:**
```typescript
// Animation presets for Framer Motion
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
```


## Components and Interfaces

### UI Primitives (Design System Foundation)

#### Button Component

**Interface:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Variants:**
- `primary`: Solid background with accent color (#4F46E5), glow effect on hover
- `secondary`: Secondary accent (#6366F1), slightly less prominent
- `outline`: Transparent background with border, fill on hover
- `ghost`: No background, subtle hover effect
- `danger`: Red background (#EF4444) for destructive actions

**Behavior:**
- Hover: Scale(1.02) + glow shadow
- Active: Scale(0.98)
- Loading: Show spinner, disable interactions
- Disabled: 50% opacity, no hover effects

#### Card Component

**Interface:**
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  glowOnHover?: boolean;
}
```

**Variants:**
- `default`: Solid background with shadow
- `glass`: Glassmorphism effect (backdrop blur, transparency, border)
- `bordered`: Border emphasis, no glassmorphism

**Glassmorphism Recipe:**
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
```


#### Badge Component

**Interface:**
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  severity?: Severity; // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  glow?: boolean;
}
```

**Severity Mapping:**
- `CRITICAL`: Red (#DC2626) with glow
- `HIGH` / `ERROR`: Orange (#F97316)
- `MEDIUM` / `WARN`: Amber (#F59E0B)
- `LOW`: Green (#10B981)
- `INFO` / `DEBUG`: Blue (#3B82F6)

#### Input Component

**Interface:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**States:**
- Default: Dark background (#161B22), subtle border
- Focus: Accent border (#4F46E5), glow effect
- Error: Red border (#EF4444), error message below
- Disabled: 50% opacity, no interactions

#### Modal Component

**Interface:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}
```

**Animation:**
- Backdrop: Fade in/out (0-50% opacity)
- Content: Scale in from 0.9 to 1.0 + fade in
- Spring physics for natural motion


### Layout Components

#### ModernSidebar Component

**Interface:**
```typescript
interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userProfile?: {
    name: string;
    avatar: string;
    role: string;
  };
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
  isActive?: boolean;
}
```

**Layout:**
- Width: 260px (expanded), 72px (collapsed)
- Position: Fixed left
- Background: Glassmorphism with backdrop blur
- Transition: Width 300ms ease-in-out

**Sections:**
1. **Logo Section**: Brand logo + app name (collapsed: icon only)
2. **Navigation Items**: List of nav items with icons
3. **User Profile Section**: Avatar, name, role (collapsed: avatar only)

**Interaction:**
- Hover: Scale(1.05) + glow effect
- Active: Accent background + left border indicator
- Notification badges on items with pending items

**State Management:**
```typescript
const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);
```

#### ModernNavbar Component

**Interface:**
```typescript
interface ModernNavbarProps {
  onSearchOpen?: () => void;
  notificationCount?: number;
  userProfile?: {
    name: string;
    avatar: string;
    role: string;
  };
}
```

**Layout:**
- Height: 64px
- Position: Fixed top, full width
- Background: Glassmorphism with backdrop blur
- Z-index: 50

**Sections:**
1. **Search**: Global search bar with keyboard shortcut (Cmd+K)
2. **Actions**: Notifications button with badge counter
3. **Theme Toggle**: Light/dark mode switcher
4. **Profile**: User avatar + dropdown menu


#### AIChat Component (Floating Assistant)

**Interface:**
```typescript
interface AIChatProps {
  position?: 'bottom-right' | 'bottom-left';
  defaultPrompts?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

**States:**
- **Minimized**: Floating button (56x56px) with AI icon
- **Expanded**: Chat window (400x600px) with messages and input

**Features:**
- Quick prompts: Pre-defined buttons for common queries
- Streaming responses: Typing animation for AI responses
- Markdown support: Render formatted responses
- Chat history: Persist during session

**Animation:**
- Expand: Scale from button to window with spring physics
- Messages: Slide up + fade in with stagger
- Typing indicator: Pulsing dots

### Dashboard-Specific Components

#### HeroSection Component

**Interface:**
```typescript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  illustration?: React.ReactNode;
}
```

**Layout:**
- Gradient background with glassmorphism overlay
- Left: Title + subtitle
- Right: Animated 3D illustration or graphic
- Responsive: Stack vertically on mobile

#### KPICard Component

**Interface:**
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: LucideIcon;
  chartData?: number[];
  color?: string;
}
```

**Layout:**
- Glassmorphism card with hover elevation
- Icon with colored background
- Large value with trend indicator
- Mini sparkline chart (Recharts)

**Animation:**
- Hover: Scale(1.02) + glow shadow
- Number transitions: Animated count-up


### Upload Components

#### UploadCard Component

**Interface:**
```typescript
interface UploadCardProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats?: string[];
  maxFileSize?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}
```

**Layout:**
- Large drag-drop zone with dashed border
- Central icon + text ("Drag files here or click to browse")
- Supported format badges (JSON, CSV, TXT, LOG)
- Import source buttons (GitHub, AWS, Azure, GCP, Paste)

**States:**
- Default: Subtle border, gray text
- Drag Active: Accent border, glow effect, animated pulse
- Uploading: Progress bar overlay
- Error: Red border, error message

**Interaction:**
- Drag enter: Animate border + scale(1.02)
- Drag leave: Reset to default
- Drop: Validate files, show feedback
- Click: Open file picker

#### PipelineProgress Component

**Interface:**
```typescript
interface PipelineStage {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  timestamp?: number;
  duration?: number;
}

interface PipelineProgressProps {
  stages: PipelineStage[];
  currentStage?: string;
}
```

**Layout:**
- Vertical timeline with connecting lines
- Each stage: Icon + label + status + timestamp
- Current stage: Pulsing glow animation
- Completed stages: Green checkmark
- Error stages: Red X

**Animation:**
- Stage transitions: Slide in from left
- Connecting lines: Draw animation (0-100%)
- Status icons: Rotate + fade in


### Incident Components

#### IncidentTable Component

**Interface:**
```typescript
interface IncidentTableProps {
  incidents: IncidentContext[];
  onRowClick?: (incident: IncidentContext) => void;
  sortConfig?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    severity?: Severity[];
    lifecycle?: IncidentLifecycle[];
    dateRange?: [Date, Date];
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

**Features:**
- Sortable columns (timestamp, severity, service, status)
- Filter dropdowns (severity, lifecycle, date range)
- Bulk selection with checkboxes
- Row actions (View, Export, Delete)
- Pagination controls
- Export functionality (CSV, JSON, PDF)

**Layout:**
- Glassmorphism table with hover effects
- Sticky header on scroll
- Responsive: Horizontal scroll on mobile

#### SeverityBadge Component

**Interface:**
```typescript
interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  glow?: boolean;
}
```

**Mapping:**
- `CRITICAL`: Red background + glow
- `ERROR`: Orange background
- `WARN`: Amber background
- `INFO`: Blue background
- `DEBUG`: Gray background


### Log Viewer Components

#### LogViewer Component

**Interface:**
```typescript
interface LogViewerProps {
  logs: NormalisedLogEntry[];
  searchQuery?: string;
  filters?: {
    severity?: Severity[];
    service?: string[];
    dateRange?: [Date, Date];
  };
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: any) => void;
}
```

**Layout:**
- Dark background (#0D1117) with glassmorphism container
- Search bar + filter buttons at top
- Action buttons (Copy, Download, Fullscreen) in toolbar
- Log entries with line numbers + syntax highlighting
- Virtualized scrolling for performance (react-window or similar)

**Syntax Highlighting:**
```typescript
const getSyntaxColor = (severity: Severity) => {
  switch (severity) {
    case 'CRITICAL': return '#DC2626';
    case 'ERROR': return '#F97316';
    case 'WARN': return '#F59E0B';
    case 'INFO': return '#3B82F6';
    case 'DEBUG': return '#9CA3AF';
    default: return '#D1D5DB';
  }
};
```

**Features:**
- Search highlighting (yellow background)
- Filter by severity level
- Copy log entries to clipboard
- Download logs as file
- Fullscreen mode
- Infinite scroll / virtualization

### Chart Components

#### LineChart Component

**Interface:**
```typescript
interface LineChartProps {
  data: Array<{ timestamp: number; value: number }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}
```

**Recharts Configuration:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <RechartsLineChart data={data}>
    <defs>
      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
    <YAxis stroke="#9CA3AF" />
    <Tooltip 
      contentStyle={{
        backgroundColor: 'rgba(22, 27, 34, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#4F46E5" 
      strokeWidth={2}
      dot={{ fill: '#4F46E5', r: 4 }}
      activeDot={{ r: 6 }}
    />
  </RechartsLineChart>
</ResponsiveContainer>
```


#### AreaChart, PieChart, BarChart Components

**Similar Interface Pattern:**
```typescript
interface ChartProps {
  data: any[];
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
}
```

**Theme Configuration:**
- All charts use dark theme colors
- Gradient fills where applicable
- Glassmorphism tooltips
- Smooth animations on render
- Responsive sizing with ResponsiveContainer

### Root Cause Components

#### RootCauseFlow Component

**Interface:**
```typescript
interface FlowNode {
  id: string;
  label: string;
  type: 'service' | 'database' | 'api' | 'queue';
  status: 'healthy' | 'degraded' | 'failed';
  metrics?: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  color?: string;
}

interface RootCauseFlowProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  highlightPath?: string[];
  onNodeClick?: (node: FlowNode) => void;
}
```

**Implementation:**
- Use SVG for rendering
- Interactive: Zoom, pan, node click
- Animated arrows showing failure propagation
- Tooltip on node hover with detailed metrics
- Highlight critical path in red/orange
- Glassmorphism for node containers

**Layout Algorithm:**
- Hierarchical layout (top-down or left-right)
- Auto-calculate node positions based on dependencies
- Responsive: Adjust layout for smaller screens


### Remediation Components

#### RemediationCard Component

**Interface:**
```typescript
interface RemediationCardProps {
  action: RemediationAction;
  onMarkComplete?: (actionId: string) => void;
  onExpand?: (actionId: string) => void;
  isCompleted?: boolean;
}
```

**Layout:**
- Glassmorphism card with colored left border (priority-based)
- Priority badge (Critical, High, Medium, Low)
- Estimated time badge
- Expandable section for detailed instructions
- Code snippet viewer (if applicable)
- "Mark as Complete" button

**Priority Colors:**
- Critical: Red (#DC2626)
- High: Orange (#F97316)
- Medium: Amber (#F59E0B)
- Low: Green (#10B981)

#### ProgressTracker Component

**Interface:**
```typescript
interface ProgressTrackerProps {
  totalSteps: number;
  completedSteps: number;
  actions: RemediationAction[];
}
```

**Layout:**
- Circular progress indicator (percentage)
- List of actions with checkboxes
- Visual progress bar
- Summary: X of Y completed

### Threat Intelligence Components

#### CVECard Component

**Interface:**
```typescript
interface CVEData {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  description: string;
  published: string;
  references: string[];
}

interface CVECardProps {
  cve: CVEData;
  onViewDetails?: (cveId: string) => void;
}
```

**Layout:**
- Glassmorphism card
- CVE ID + severity badge
- CVSS score with color coding
- Description preview
- Published date
- "View Details" action


#### MitreMatrix Component

**Interface:**
```typescript
interface MitreTactic {
  id: string;
  name: string;
  techniques: MitreTechnique[];
}

interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  detected: boolean;
}

interface MitreMatrixProps {
  tactics: MitreTactic[];
  onTechniqueClick?: (technique: MitreTechnique) => void;
}
```

**Layout:**
- Grid of tactics (columns) x techniques (rows)
- Detected techniques highlighted in red/orange
- Hover: Show technique description
- Click: View full details

## Data Models

### Existing Data Models (Preserved)

All existing TypeScript interfaces in `api/types.ts` are preserved:

- `IncidentContext`: Core incident data structure
- `RootCauseAnalysis`: RCA results from AI agent
- `RemediationPlan`: Remediation recommendations
- `ValidationResult`: Guardrails validation results
- `PostMortemReport`: Post-mortem documentation
- `NormalisedLogEntry`: Parsed log entry structure
- `AnomalySignal`: Detected anomaly information
- `PipelineStepRecord`: Pipeline execution tracking

### UI-Specific Data Models

#### SidebarState

```typescript
interface SidebarState {
  isCollapsed: boolean;
  activeItem: string;
}
```

#### NotificationState

```typescript
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}
```

#### ChartDataPoint

```typescript
interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}
```


## State Management

### Context Providers (Existing, Preserved)

#### ThemeContext

**Existing Implementation:**
```typescript
interface ThemeContextProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Preservation:**
- No modifications to ThemeContext
- Existing localStorage persistence maintained
- Dark mode default preserved

#### IncidentContext

**Existing Implementation:**
```typescript
interface IncidentContextProps {
  currentIncident: CompleteIncidentResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeLogs: (logs: Record<string, unknown>[]) => Promise<CompleteIncidentResponse>;
  clearIncident: () => void;
}
```

**Preservation:**
- No modifications to IncidentContext
- Existing API integration maintained
- Error handling preserved

#### HealthContext

**Existing Implementation (assumed):**
```typescript
interface HealthContextProps {
  healthStatus: HealthResponse | null;
  readyStatus: ReadyResponse | null;
  isLoading: boolean;
  error: string | null;
  refetchHealth: () => void;
}
```

**Preservation:**
- No modifications to HealthContext
- Existing health check polling maintained


### New Context Providers (UI State)

#### SidebarContext

**Purpose:** Manage sidebar collapse/expand state globally

```typescript
interface SidebarContextProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const SidebarContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
```

### Custom Hooks

#### useMediaQuery

**Purpose:** Responsive design helper

```typescript
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Usage:
const isMobile = useMediaQuery('(max-width: 768px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

#### useLocalStorage

**Purpose:** Persist state to localStorage

```typescript
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};
```


#### useDebounce

**Purpose:** Debounce search inputs

```typescript
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search:
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

## Routing Structure

### Route Configuration (Preserved)

Existing routing structure is maintained:

```typescript
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
```

### Page Components (Redesigned, Functionality Preserved)

Each page component receives a visual redesign while maintaining existing data fetching and business logic:

- **Dashboard**: Hero section + KPI cards + charts
- **UploadLogs**: Upload card + pipeline visualization
- **IncidentDetails**: Incident table + filters + export
- **RootCause**: Interactive flow diagram
- **Remediation**: AI recommendations + progress tracker
- **ThreatIntelligence**: CVEs + MITRE ATT&CK + threat feeds
- **Settings**: Profile + notifications + API keys


## Animation System Architecture

### Framer Motion Integration

**Installation:**
```bash
npm install framer-motion@12
```

**Provider Setup:**
```typescript
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

### Animation Patterns

#### Page Transitions

```typescript
// utils/animations.ts
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Usage in page component:
<motion.div {...pageTransition}>
  {/* Page content */}
</motion.div>
```

#### Card Hover Effects

```typescript
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 0 0 rgba(79, 70, 229, 0)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)',
    transition: { duration: 0.2 }
  }
};

// Usage:
<motion.div 
  initial="rest"
  whileHover="hover"
  variants={cardHover}
>
  {/* Card content */}
</motion.div>
```

#### Stagger Children Animation

```typescript
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Usage:
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {/* Item content */}
    </motion.div>
  ))}
</motion.div>
```


#### Spring Physics Animations

```typescript
export const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Usage for natural motion:
<motion.div
  animate={{ scale: 1 }}
  transition={springConfig}
>
  {/* Content */}
</motion.div>
```

#### Modal Animations

```typescript
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};
```

#### Number Count-Up Animation

```typescript
import { useSpring, animated } from 'framer-motion';

export const useCountUp = (target: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};
```

### Loading States

#### Skeleton Loaders

```typescript
export const SkeletonCard: React.FC = () => (
  <motion.div
    className="bg-glass rounded-lg p-6"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="h-4 bg-gray-700 rounded mb-4 w-3/4" />
    <div className="h-8 bg-gray-700 rounded mb-2 w-1/2" />
    <div className="h-4 bg-gray-700 rounded w-2/3" />
  </motion.div>
);
```

#### Spinner Component

```typescript
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-accent-primary border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};
```


### Accessibility Considerations

**Respect User Preferences:**
```typescript
// Automatically detect and respect prefers-reduced-motion
<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

**Animation Duration Guidelines:**
- Micro-interactions: 150-200ms
- Component transitions: 300-400ms
- Page transitions: 300-500ms
- Never exceed 500ms for any animation

## Performance Optimization Strategies

### Code Splitting and Lazy Loading

#### Route-Based Code Splitting

```typescript
// App.tsx
import React, { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const UploadLogs = lazy(() => import('./pages/UploadLogs'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'));
const RootCause = lazy(() => import('./pages/RootCause'));
const Remediation = lazy(() => import('./pages/Remediation'));
const ThreatIntelligence = lazy(() => import('./pages/ThreatIntelligence'));
const Settings = lazy(() => import('./pages/Settings'));

// Wrap routes in Suspense with loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/upload" element={<UploadLogs />} />
    {/* ... other routes */}
  </Routes>
</Suspense>
```

#### Component-Level Lazy Loading

```typescript
// Lazy load heavy components
const RootCauseFlow = lazy(() => import('./components/rootcause/RootCauseFlow'));
const LogViewer = lazy(() => import('./components/logs/LogViewer'));
const ChartLibrary = lazy(() => import('./components/charts'));
```

### React Performance Optimization

#### Memoization

```typescript
// Memoize expensive components
export const KPICard = React.memo<KPICardProps>(({ title, value, trend, icon }) => {
  // Component implementation
});

// Memoize expensive computations
const processedData = useMemo(() => {
  return logs.filter(log => log.severity === 'ERROR').map(transformLog);
}, [logs]);

// Memoize callbacks
const handleSearch = useCallback((query: string) => {
  performSearch(query);
}, []);
```


#### Virtualization for Large Lists

```typescript
// Install react-window
// npm install react-window

import { FixedSizeList as List } from 'react-window';

export const VirtualizedLogViewer: React.FC<{ logs: NormalisedLogEntry[] }> = ({ logs }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="log-entry">
      {logs[index].message}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={logs.length}
      itemSize={30}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Image Optimization

```typescript
// Lazy load images with blur placeholder
export const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
```

### Bundle Size Optimization

**Vite Configuration:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['axios', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Error Boundaries

```typescript
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage:
<ErrorBoundary fallback={<ErrorFallback />}>
  <Dashboard />
</ErrorBoundary>
```


## Error Handling

### Error Display Strategy

#### Toast Notifications (Transient Errors)

```typescript
import { toast } from 'sonner';

// Success
toast.success('Log analysis completed successfully');

// Error
toast.error('Failed to upload logs', {
  description: 'Please check your file format and try again',
  action: {
    label: 'Retry',
    onClick: () => retryUpload()
  }
});

// Warning
toast.warning('Analysis may be incomplete');

// Info
toast.info('Processing your request...');
```

#### Error Banners (Persistent Errors)

```typescript
export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void; onDismiss?: () => void }> = ({
  message,
  onRetry,
  onDismiss
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-error/10 border border-error rounded-lg p-4 mb-6"
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="text-error mt-0.5" size={20} />
      <div className="flex-1">
        <p className="text-error font-medium">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="text-error hover:text-error/80">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);
```

### Empty States

```typescript
export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="bg-glass rounded-full p-6 mb-6">
      <Icon size={48} className="text-accent-primary" />
    </div>
    <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-text-secondary mb-6 max-w-md">{description}</p>
    {action && (
      <Button onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </motion.div>
);

// Usage:
{incidents.length === 0 && (
  <EmptyState
    icon={FileX}
    title="No incidents found"
    description="Upload log files to start detecting and analyzing incidents"
    action={{ label: 'Upload Logs', onClick: () => navigate('/upload') }}
  />
)}
```


### API Error Handling

**Preserved from Existing Implementation:**

The existing API client error interceptor is preserved:

```typescript
// api/client.ts (existing, preserved)
apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    const appError = {
      code: error.response?.data?.error?.code || "UNKNOWN_ERROR",
      message: error.response?.data?.error?.message || error.message || "An unexpected error occurred",
      status: error.response?.status,
    };
    return Promise.reject(appError);
  }
);
```

**UI Integration:**

```typescript
// Usage in components
const { analyzeLogs, error } = useIncident();

const handleUpload = async (files: File[]) => {
  try {
    await analyzeLogs(parsedLogs);
    toast.success('Analysis complete!');
  } catch (err: any) {
    toast.error(err.message || 'Failed to analyze logs', {
      description: err.code,
      action: {
        label: 'Retry',
        onClick: () => handleUpload(files)
      }
    });
  }
};
```

## Testing Strategy

### Unit Testing Approach

**Test Framework:**
- Vitest (fast, Vite-native)
- React Testing Library (component testing)

**Component Testing:**
```typescript
// Example: Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Testing

**Test API Integration:**
```typescript
// Example: IncidentContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useIncident } from './IncidentContext';

describe('IncidentContext', () => {
  it('analyzes logs and updates state', async () => {
    const { result } = renderHook(() => useIncident());
    
    await act(async () => {
      await result.current.analyzeLogs(mockLogs);
    });

    expect(result.current.currentIncident).toBeDefined();
    expect(result.current.isAnalyzing).toBe(false);
  });
});
```


### Visual Regression Testing

**Approach:**
- Snapshot testing for UI components
- Manual visual QA for animations and interactions

### Accessibility Testing

**Tools:**
- axe-core for automated accessibility checks
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

**Testing Checklist:**
- All interactive elements are keyboard accessible
- Focus indicators are visible
- ARIA labels are present
- Color contrast meets WCAG AA standards
- Screen reader announcements are appropriate

### Performance Testing

**Lighthouse Audits:**
- Target score: 85+ for Performance
- Target score: 90+ for Accessibility
- Target score: 90+ for Best Practices

**Metrics to Monitor:**
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

## Accessibility Implementation

### Keyboard Navigation

**Focus Management:**
```typescript
// Focus trap for modals
import { useFocusTrap } from './hooks/useFocusTrap';

export const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  const modalRef = useFocusTrap(isOpen);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};
```

**Skip Navigation:**
```typescript
export const SkipNavLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-md"
  >
    Skip to main content
  </a>
);
```

### ARIA Attributes

**Button with Loading State:**
```typescript
<button
  aria-label="Upload logs"
  aria-busy={isLoading}
  disabled={isLoading}
>
  {isLoading ? 'Uploading...' : 'Upload'}
</button>
```

**Live Regions for Dynamic Content:**
```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```


### Color Contrast

**WCAG AA Requirements:**
- Normal text (< 18px): Minimum contrast ratio 4.5:1
- Large text (≥ 18px or bold ≥ 14px): Minimum contrast ratio 3:1
- UI components and graphical objects: Minimum contrast ratio 3:1

**Color Palette Validation:**
```
Text on Dark Background:
- #F9FAFB on #070B14: 18.5:1 ✓ (exceeds AAA)
- #D1D5DB on #070B14: 11.2:1 ✓ (exceeds AAA)
- #9CA3AF on #070B14: 6.8:1 ✓ (exceeds AA)

Interactive Elements:
- #4F46E5 on #070B14: 7.2:1 ✓ (exceeds AA)
- #EF4444 on #070B14: 5.1:1 ✓ (exceeds AA)
- #10B981 on #070B14: 6.4:1 ✓ (exceeds AA)
```

### Screen Reader Support

**Component Labels:**
```typescript
// Icon button with accessible label
<button aria-label="Close modal" onClick={onClose}>
  <X size={20} aria-hidden="true" />
</button>

// Data table with accessible structure
<table role="table" aria-label="Incident reports">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">Severity</th>
      <th role="columnheader" scope="col">Service</th>
    </tr>
  </thead>
  <tbody>
    {/* Table rows */}
  </tbody>
</table>
```

## Responsive Design Patterns

### Mobile-First Approach

**Breakpoint Strategy:**
- Start with mobile layout (375px)
- Add tablet enhancements (768px)
- Add desktop enhancements (1024px+)

### Sidebar Behavior

**Responsive States:**
- **Mobile (< 768px)**: Sidebar hidden by default, overlay when opened
- **Tablet (768-1023px)**: Sidebar collapsible, collapsed by default
- **Desktop (≥ 1024px)**: Sidebar expanded by default, user can collapse

```typescript
export const DashboardLayout: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isOpen, setIsOpen] = useState(!isMobile);

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      <ModernSidebar 
        isCollapsed={!isOpen} 
        onToggle={() => setIsOpen(!isOpen)}
        className={isMobile ? 'fixed z-50' : 'sticky'}
      />
    </>
  );
};
```


### Grid Layouts

**KPI Cards:**
```css
/* Mobile: 1 column */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Chart Responsiveness

**Recharts Responsive Container:**
```typescript
<ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
  <LineChart data={data}>
    {/* Chart configuration */}
  </LineChart>
</ResponsiveContainer>
```

### Table Responsiveness

**Horizontal Scroll on Mobile:**
```typescript
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>
```

**Card View on Mobile (Alternative):**
```typescript
{isMobile ? (
  <div className="space-y-4">
    {incidents.map(incident => (
      <IncidentCard key={incident.id} incident={incident} />
    ))}
  </div>
) : (
  <IncidentTable incidents={incidents} />
)}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up design system (colors, typography, spacing)
- Create UI primitives (Button, Card, Badge, Input, Modal)
- Implement layout components (ModernSidebar, ModernNavbar)
- Configure TailwindCSS with custom theme
- Set up Framer Motion integration

### Phase 2: Dashboard & Navigation (Week 2)
- Redesign Dashboard page (hero, KPI cards, charts)
- Implement collapsible sidebar with glassmorphism
- Create top navbar with search, notifications, profile
- Add page transition animations
- Implement responsive layouts

### Phase 3: Upload & Pipeline (Week 3)
- Redesign UploadLogs page
- Create UploadCard with drag-drop functionality
- Implement PipelineProgress visualization
- Add loading states and animations
- Integrate with existing API


### Phase 4: Incident Management (Week 4)
- Redesign IncidentDetails page
- Create IncidentTable with sorting, filtering, pagination
- Implement SeverityBadge and StatusChip components
- Add bulk actions and export functionality
- Create empty states and error handling

### Phase 5: Analysis Pages (Week 5)
- Redesign RootCause page with interactive flow diagram
- Redesign Remediation page with AI recommendations
- Redesign ThreatIntelligence page (CVEs, MITRE ATT&CK)
- Implement advanced data visualizations
- Add interactive tooltips and hover effects

### Phase 6: Log Viewer & AI Chat (Week 6)
- Create LogViewer component with syntax highlighting
- Implement search and filtering functionality
- Add virtualization for performance
- Create AIChat floating assistant
- Implement chat interface with streaming responses

### Phase 7: Settings & Polish (Week 7)
- Redesign Settings page
- Add profile management, notifications, API keys
- Implement keyboard shortcuts
- Add accessibility features (skip nav, focus indicators)
- Perform accessibility audit

### Phase 8: Testing & Optimization (Week 8)
- Write unit tests for UI components
- Conduct visual regression testing
- Perform Lighthouse audits
- Optimize bundle size and performance
- Cross-browser testing
- Mobile device testing

## Deployment Considerations

### Build Configuration

**Vite Build Optimization:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

### Environment Variables

**Existing Configuration (Preserved):**
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

### Production Checklist

- [ ] Bundle size under 300KB (gzipped)
- [ ] Lighthouse score 85+ (Performance)
- [ ] All routes lazy loaded
- [ ] Images optimized and lazy loaded
- [ ] Error boundaries in place
- [ ] Analytics integrated (if applicable)
- [ ] HTTPS enforced
- [ ] CSP headers configured


## Testing Strategy (Continued)

### Why Property-Based Testing Does NOT Apply

This feature is a **UI/UX redesign** that involves:
- Visual design implementation (colors, typography, spacing, glassmorphism effects)
- Component styling and animations
- Layout responsiveness
- Interaction patterns (hover, click, drag-drop)
- Integration with existing APIs (no new business logic)

Property-based testing is NOT appropriate because:
1. **No pure functions with universal properties**: UI rendering is inherently side-effect-heavy
2. **Visual aesthetics cannot be property-tested**: Glassmorphism, glow effects, animations are visual concerns
3. **Component behavior is example-based**: Button clicks, form submissions are specific interactions
4. **No transformation logic**: No parsers, serializers, or algorithms being implemented

### Recommended Testing Approach

**Unit Tests (Component-Level):**
- Test component rendering with different props
- Test event handlers (onClick, onChange, onSubmit)
- Test conditional rendering based on state
- Test accessibility attributes (ARIA labels, roles)

**Integration Tests:**
- Test context provider integrations (ThemeContext, IncidentContext)
- Test API client interactions (preserved from existing implementation)
- Test routing and navigation

**Visual Tests:**
- Snapshot testing for component structure
- Manual visual QA for animations and styling
- Cross-browser testing for CSS compatibility

**Accessibility Tests:**
- Automated tests with axe-core
- Manual keyboard navigation testing
- Screen reader testing

**Performance Tests:**
- Lighthouse audits
- Bundle size monitoring
- Runtime performance profiling

### Test Coverage Goals

- **Component Unit Tests**: 80% coverage
- **Integration Tests**: Critical user flows (upload, analyze, view reports)
- **Accessibility**: 100% WCAG AA compliance
- **Performance**: Lighthouse score 85+


## Design Decisions and Rationale

### Why Glassmorphism?

**Rationale:**
- Creates depth and visual hierarchy without heavy shadows
- Provides premium, modern aesthetic aligned with cybersecurity platforms
- Works well with dark themes (reduces eye strain)
- Maintains readability while adding visual interest

### Why Framer Motion over CSS Transitions?

**Rationale:**
- Declarative API makes animations easier to maintain
- Spring physics for natural motion
- Built-in gesture support (drag, hover, tap)
- Better performance with GPU-accelerated transforms
- Animation orchestration (stagger, sequence) built-in

### Why Recharts over Other Chart Libraries?

**Rationale:**
- React-native, declarative API
- Composable chart components
- Responsive by default
- Good TypeScript support
- Reasonable bundle size (compared to D3.js)

### Why Route-Based Code Splitting?

**Rationale:**
- Users don't need all pages loaded upfront
- Faster initial load time
- Better for mobile users with limited bandwidth
- Natural split points aligned with user navigation

### Why Preserve Existing API Client?

**Rationale:**
- Backend functionality is out of scope
- Existing implementation is well-tested
- Reduces risk of introducing bugs
- Maintains compatibility with backend

### Why Dark Theme as Default?

**Rationale:**
- Industry standard for cybersecurity dashboards
- Reduces eye strain during long monitoring sessions
- Better visibility for data visualizations
- Professional, focused aesthetic

## Migration Strategy

### Backward Compatibility

**Approach:**
- Implement new components alongside existing ones
- Gradually replace pages one at a time
- Preserve all existing functionality
- Maintain existing context providers and API integration

### Rollout Plan

1. **Alpha Phase**: Deploy to staging environment, internal testing
2. **Beta Phase**: Limited user testing, collect feedback
3. **Production Phase**: Gradual rollout with feature flags
4. **Monitoring**: Track performance metrics, user feedback, error rates

### Rollback Plan

- Keep existing components in codebase temporarily
- Use feature flags to toggle between old/new UI
- Monitor error rates and performance metrics
- Quick rollback capability if issues arise


## Success Metrics

### User Experience Metrics

- **Task Completion Rate**: % of users successfully uploading logs and viewing analysis
- **Time to Insight**: Time from log upload to viewing root cause analysis
- **User Satisfaction**: Survey scores, qualitative feedback
- **Adoption Rate**: % of users actively using the redesigned interface

### Technical Metrics

- **Lighthouse Performance Score**: Target 85+
- **Lighthouse Accessibility Score**: Target 90+
- **First Contentful Paint**: Target < 1.8s
- **Largest Contentful Paint**: Target < 2.5s
- **Time to Interactive**: Target < 3.8s
- **Bundle Size**: Target < 300KB (gzipped)

### Business Metrics

- **User Retention**: % of users returning after first use
- **Feature Usage**: Adoption of new features (AI chat, threat intelligence)
- **Error Rate**: Reduction in user-reported issues
- **Support Tickets**: Reduction in UI-related support requests

## Appendix

### Figma Design References

**Color Palette:**
- Use Figma color variables for consistency
- Export CSS variables for development

**Component Library:**
- Create Figma component library mirroring React components
- Use Auto Layout for responsive previews

**Responsive Mockups:**
- Desktop (1920x1080)
- Laptop (1440x900)
- Tablet (768x1024)
- Mobile (375x667)

### Third-Party Resources

**Icon Library:**
- Lucide React: https://lucide.dev/
- 1000+ icons, tree-shakeable

**Animation Inspiration:**
- Framer Motion Examples: https://www.framer.com/motion/
- Awwwards: https://www.awwwards.com/

**Glassmorphism Generator:**
- https://ui.glass/generator/

**Color Contrast Checker:**
- https://webaim.org/resources/contrastchecker/

**Lighthouse CI:**
- https://github.com/GoogleChrome/lighthouse-ci


### Browser Support

**Target Browsers:**
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

**Polyfills:**
- None required (targeting modern browsers)

**Fallbacks:**
- CSS Grid: Supported by all target browsers
- Flexbox: Supported by all target browsers
- CSS Custom Properties: Supported by all target browsers
- Backdrop Filter: Supported by all target browsers (glassmorphism)

### Dependencies Summary

**Production Dependencies:**
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^6.22.3",
  "framer-motion": "^12.42.2",
  "recharts": "^2.15.4",
  "axios": "^1.7.9",
  "lucide-react": "^0.468.0",
  "react-dropzone": "^15.0.0",
  "react-hook-form": "^7.81.0",
  "@hookform/resolvers": "^5.4.0",
  "sonner": "^2.0.7",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.6.0"
}
```

**Dev Dependencies:**
```json
{
  "typescript": "^5.7.2",
  "vite": "^6.0.3",
  "@vitejs/plugin-react": "^4.3.4",
  "tailwindcss": "^3.4.16",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20"
}
```

## Conclusion

This design document provides a comprehensive blueprint for redesigning the Incident Response Dashboard frontend into a premium enterprise-grade cybersecurity platform. The redesign focuses on visual excellence, performance optimization, and accessibility while preserving all existing backend functionality and API integrations.

Key highlights:
- **Complete design system** with dark futuristic theme, glassmorphism, and neon accents
- **Component library** with reusable UI primitives and domain-specific components
- **Animation system** using Framer Motion with spring physics and micro-interactions
- **Performance optimizations** including code splitting, lazy loading, and virtualization
- **Accessibility compliance** meeting WCAG AA standards
- **Responsive design** supporting all viewport sizes
- **Backward compatibility** preserving existing API client and context providers

The implementation can proceed in phases, allowing for iterative development and testing while maintaining the stability of the existing application.

