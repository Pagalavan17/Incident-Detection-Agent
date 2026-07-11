/**
 * src/constants/app.constants.ts
 *
 * PURPOSE:
 *   Single source of truth for application-level identity constants and
 *   sensible default values used across the entire codebase.
 *
 *   Without this file, strings like "incident-response-agent" and numeric
 *   values like 3000 appear scattered across env.ts, telemetry config,
 *   API middleware, and Docker configs — with no guarantee they stay in sync.
 *
 * WHERE IT WILL BE USED:
 *   • src/config/env.ts          — Zod default values (PORT, service name, models)
 *   • src/config/telemetry.ts    — OpenTelemetry service.name attribute
 *   • src/api/middleware/         — request-id generation, error responses
 *   • src/mastra/agents/          — agent identity metadata
 *   • docs/ and report templates  — report headers
 *
 * HOW TO VERIFY:
 *   import { APP_NAME, APP_VERSION } from '../constants/app.constants.ts';
 *   console.assert(APP_NAME === 'incident-response-agent');
 *   npm run typecheck  →  zero errors
 *
 * DEPENDENCY RULE:
 *   This file MUST NOT import from any other src/ module.
 *   It may only contain literal values and derived constants.
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Application Identity
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical application name used in logs, traces, and report headers. */
export const APP_NAME = "incident-response-agent" as const;

/**
 * Semantic version of the application.
 * Kept in sync with package.json manually; updated on each release.
 */
export const APP_VERSION = "0.1.0" as const;

/**
 * Human-readable display name for UI labels and report titles.
 */
export const APP_DISPLAY_NAME = "Incident Response & Post-Mortem Agent" as const;

/**
 * Organisation / team name shown in generated post-mortem reports.
 */
export const APP_TEAM_NAME = "HiDevs" as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Server Defaults
// ─────────────────────────────────────────────────────────────────────────────

/** Default HTTP port for the Express API server. */
export const DEFAULT_PORT = 3000 as const;

/**
 * Default OpenAI model identifier for auxiliary generation tasks.
 */
export const DEFAULT_OPENAI_MODEL = "gpt-4o" as const;

/**
 * Default Anthropic model identifier for RCA, remediation, guardrails, and post-mortem generation.
 */
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929" as const;

/** Default runtime environment when NODE_ENV is not set. */
export const DEFAULT_NODE_ENV = "development" as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 3. AI Model Identifiers
//
//   These are the string identifiers passed to the Anthropic / OpenAI SDKs.
//   Centralised here so that upgrading a model requires a single change.
// ─────────────────────────────────────────────────────────────────────────────



/**
 * Default OpenAI embedding model.
 * text-embedding-3-small: 1536 dimensions — cost-efficient, strong performance
 * for semantic similarity search in Qdrant.
 */
export const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small" as const;

/**
 * Alternative high-accuracy OpenAI embedding model.
 * text-embedding-3-large: 3072 dimensions — use for higher-precision retrieval.
 */
export const LARGE_OPENAI_EMBEDDING_MODEL = "text-embedding-3-large" as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 4. OpenTelemetry Defaults
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default OTLP service name reported to the tracing backend.
 * Must match APP_NAME for consistent trace attribution.
 */
export const DEFAULT_OTEL_SERVICE_NAME = APP_NAME;

/**
 * Default OTLP HTTP exporter endpoint (Jaeger / Grafana Tempo / Collector).
 * Only used if OTEL_EXPORTER_OTLP_ENDPOINT is not set in the environment.
 */
export const DEFAULT_OTEL_ENDPOINT = "http://localhost:4318" as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 5. API Defaults
// ─────────────────────────────────────────────────────────────────────────────

/** Default pagination page size for list endpoints. */
export const DEFAULT_PAGE_SIZE = 20 as const;

/** Maximum pagination page size accepted from clients. */
export const MAX_PAGE_SIZE = 100 as const;

/** Default API version prefix for all routes. */
export const API_VERSION_PREFIX = "/api/v1" as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Report & Post-Mortem Defaults
// ─────────────────────────────────────────────────────────────────────────────

/** Directory where generated post-mortem reports are written. */
export const REPORTS_DIR = "reports" as const;

/** Date format used in generated report filenames (YYYY-MM-DD). */
export const REPORT_DATE_FORMAT = "YYYY-MM-DD" as const;
