// --- Common Types ---
export type Severity = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
export type Priority = "P1" | "P2" | "P3" | "P4";

export type IncidentLifecycle =
  | "DETECTED"
  | "TRIAGING"
  | "ANALYSING"
  | "REMEDIATING"
  | "VALIDATED"
  | "RESOLVED"
  | "FAILED"
  | "CLOSED";

export type AnomalyType =
  | "SPIKE"
  | "DROP"
  | "PATTERN"
  | "SILENCE"
  | "LATENCY"
  | "GENERIC";

export type RemediationValidationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_REVIEW";

export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}

// --- Health Probe Types ---
export interface ServiceStatus {
  readonly name: string;
  readonly status: "ok" | "degraded" | "unconfigured";
  readonly latencyMs?: number;
  readonly message?: string;
}

export interface HealthResponse {
  readonly status: "ok";
}

export interface ReadyResponse {
  readonly status: "ok" | "degraded";
  readonly timestamp: string;
  readonly services: ServiceStatus[];
}

// --- Log Schema ---
export interface RawLogEntry {
  readonly [key: string]: unknown;
}

export interface NormalisedLogEntry {
  readonly id: string;
  readonly source: string;
  readonly timestamp: number;
  readonly timestampIso: string;
  readonly severity: Severity;
  readonly message: string;
  readonly service: string;
  readonly host: string;
  readonly correlationId?: string;
  readonly environment?: string;
  readonly metadata?: Record<string, unknown>;
  readonly raw: RawLogEntry;
}

export interface LogBatchMeta {
  readonly source: string;
  readonly sourceId: string;
  readonly collectedAt: number;
  readonly rawEntryCount: number;
}

export interface ParsedLogBatch {
  readonly meta: LogBatchMeta;
  readonly entries: NormalisedLogEntry[];
}

// --- Pipeline Outputs ---
export interface AnomalySignal {
  readonly id: string;
  readonly type: AnomalyType;
  readonly description: string;
  readonly confidence: number;
  readonly severity: Severity;
  readonly detectedAt: number;
  readonly triggeringEntries: NormalisedLogEntry[];
  readonly metadata?: Record<string, unknown>;
}

export interface SimilarIncident {
  readonly incidentId: string;
  readonly similarity: number;
  readonly summary: string;
  readonly rootCause?: string;
  readonly remediations: string[];
  readonly occurredAt: string;
}

export interface RetrievalResult {
  readonly queryIncidentId: string;
  readonly matches: ReadonlyArray<SimilarIncident>;
  readonly searchedAt: string;
}

export interface RootCauseAnalysis {
  readonly probableCause: string;
  readonly confidence: number;
  readonly evidence: string[];
  readonly reasoning: string;
  readonly relatedIncidents: string[];
  readonly supportingAnomalies: string[];
}

export interface RemediationAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly command?: string;
  readonly confidence: number;
  readonly isAutomatable: boolean;
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
  readonly validationStatus: RemediationValidationStatus;
  readonly validationNotes?: string;
  readonly priority: number;
}

export interface RemediationPlan {
  readonly immediateActions: string[];
  readonly longTermFixes: string[];
  readonly rollbackRequired: boolean;
  readonly rollbackSteps: string[];
  readonly estimatedImpact: string;
  readonly confidence: number;
  readonly prerequisites: string[];
  readonly risks: string[];
}

export interface ValidationResult {
  readonly approved: boolean;
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
  readonly issues: string[];
  readonly warnings: string[];
  readonly confidence: number;
  readonly failedChecks: string[];
}

export interface TimelineEntry {
  readonly timestamp: number;
  readonly description: string;
  readonly actor: "SYSTEM" | "ON_CALL_ENGINEER" | "AUTO_REMEDIATION";
}

export interface PostMortemActionItem {
  readonly description: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface PostMortemDraft {
  readonly title: string;
  readonly executiveSummary: string;
  readonly timeline: TimelineEntry[];
  readonly rootCause: string;
  readonly impact: string;
  readonly resolutionSteps: string[];
  readonly actionItems: PostMortemActionItem[];
  readonly isApproved: boolean;
  readonly generatedAt: number;
}

export interface PostMortemReport {
  readonly executiveSummary: string;
  readonly incidentTimeline: string[];
  readonly impactAssessment: string;
  readonly rootCauseSummary: string;
  readonly remediationSummary: string;
  readonly validationSummary: string;
  readonly lessonsLearned: string[];
  readonly actionItems: string[];
}

export interface PipelineStepRecord {
  readonly stepName: string;
  readonly status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly durationMs?: number;
}

export interface IncidentContext {
  readonly id: string;
  readonly correlationId: string;
  readonly runId: string;
  readonly lifecycle: IncidentLifecycle;
  readonly priority: Priority;
  readonly severity: Severity;
  readonly title: string;
  readonly detectedAt: number;
  readonly updatedAt: number;
  readonly resolvedAt?: number;
  readonly signal: AnomalySignal;
  readonly logBatch?: ParsedLogBatch;
  readonly relevantLogs?: NormalisedLogEntry[];
  readonly similarIncidents?: SimilarIncident[];
  readonly rca?: RootCauseAnalysis;
  readonly remediations?: RemediationAction[];
  readonly postMortemDraft?: PostMortemDraft;
  readonly pipelineHistory: PipelineStepRecord[];
  readonly errors: AppError[];
}

// --- Main Pipeline Response ---
export interface CompleteIncidentResponse {
  readonly incident: IncidentContext;
  readonly anomalies: AnomalySignal[];
  readonly historicalMatches: SimilarIncident[];
  readonly rootCause: RootCauseAnalysis | null;
  readonly remediation: RemediationPlan | null;
  readonly guardrails: ValidationResult | null;
  readonly postMortem: PostMortemReport | null;
  readonly stepErrors?: Readonly<Partial<Record<
    "retrieval" | "rootCause" | "remediation" | "guardrails" | "postMortem",
    AppError
  >>> | undefined;
}

// HTTP Response Envelope
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
}
