import axios from "axios";
import { API_VERSION } from "./config";
import type {
  ReadyResponse,
  HealthResponse,
  CompleteIncidentResponse,
  ApiResponse,
  IncidentContext,
  RootCauseAnalysis,
  RemediationPlan,
  ValidationResult,
  PostMortemReport,
} from "./types";

// Create Axios Client
export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Generate/Attach request tracking correlation ID if not present
    if (!config.headers["x-request-id"]) {
      config.headers["x-request-id"] = crypto.randomUUID();
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: any) => {
    // Standardize error formats for the frontend
    const appError = {
      code: error.response?.data?.error?.code || "UNKNOWN_ERROR",
      message: error.response?.data?.error?.message || error.message || "An unexpected error occurred",
      status: error.response?.status,
    };
    return Promise.reject(appError);
  }
);

// --- API Layer Typed Methods ---

// GET /health - Liveness check
export const apiGetHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>("/health");
  return response.data;
};

// GET /ready - Readiness check (checked services, latencies)
export const apiGetReady = async (): Promise<ReadyResponse> => {
  const response = await apiClient.get<ReadyResponse>("/ready");
  return response.data;
};

// POST /api/v1/incident/analyze - Full pipeline execution
export const apiAnalyze = async (logs: Record<string, unknown>[]): Promise<ApiResponse<CompleteIncidentResponse>> => {
  const response = await apiClient.post<ApiResponse<CompleteIncidentResponse>>(
    `${API_VERSION}/incident/analyze`,
    { logs }
  );
  return response.data;
};

// POST /api/v1/root-cause - Debug RCA only (under the hood / for future extensions)
export const apiRootCause = async (context: IncidentContext): Promise<ApiResponse<{ rootCause: RootCauseAnalysis | null }>> => {
  const response = await apiClient.post<ApiResponse<{ rootCause: RootCauseAnalysis | null }>>(
    `${API_VERSION}/root-cause`,
    { context }
  );
  return response.data;
};

// POST /api/v1/remediation - Debug Remediation only
export const apiRemediation = async (context: IncidentContext): Promise<ApiResponse<{ remediation: RemediationPlan | null }>> => {
  const response = await apiClient.post<ApiResponse<{ remediation: RemediationPlan | null }>>(
    `${API_VERSION}/remediation`,
    { context }
  );
  return response.data;
};

// POST /api/v1/guardrails - Debug Guardrails only
export const apiGuardrails = async (context: IncidentContext): Promise<ApiResponse<{ guardrails: ValidationResult | null }>> => {
  const response = await apiClient.post<ApiResponse<{ guardrails: ValidationResult | null }>>(
    `${API_VERSION}/guardrails`,
    { context }
  );
  return response.data;
};

// POST /api/v1/postmortem - Debug Post-Mortem only
export const apiPostmortem = async (context: IncidentContext): Promise<ApiResponse<{ postMortem: PostMortemReport | null }>> => {
  const response = await apiClient.post<ApiResponse<{ postMortem: PostMortemReport | null }>>(
    `${API_VERSION}/postmortem`,
    { context }
  );
  return response.data;
};
