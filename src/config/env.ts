/**
 * src/config/env.ts
 *
 * PURPOSE:
 *   Single source of truth for all environment variables.
 *   Loads .env via dotenv, validates every required value with Zod at startup,
 *   and exports a deeply frozen, fully-typed `env` object.
 *
 *   If ANY required variable is missing or invalid, the process exits with a
 *   clear, actionable error message before any application logic runs.
 *   This is the "fail fast at boot" pattern — misconfiguration is caught
 *   immediately, not hours into a production incident.
 *
 * DESIGN DECISIONS:
 *   • Zod 4 schema              — validates types, coerces strings to numbers,
 *     provides default values, and generates readable error messages.
 *   • Object.freeze() deep      — the exported env is frozen so no service
 *     can accidentally mutate a config value at runtime.
 *   • No re-export of raw       — consumers import `env` (typed object), never
 *     `process.env` (untyped, mutable). This is enforced by convention.
 *   • Helper getters            — isDevelopment(), isProduction() etc. keep
 *     conditional logic readable in consumers.
 *   • Isolation                 — this file imports NOTHING from the domain.
 *     It depends only on dotenv and zod. The domain depends on this.
 *
 * DEPENDENCY RULE:
 *   Imports from dotenv, zod, and src/constants/ (which have zero deps).
 *   Constants are more primitive than env — importing them here is safe.
 *   No imports from types/, contracts/, models/, or any service module.
 *   All other src/ modules MAY import from here.
 */

import { config as loadDotEnv } from "dotenv";
import { z } from "zod";
import {
  APP_NAME,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_EMBEDDING_MODEL,
  LARGE_OPENAI_EMBEDDING_MODEL,
} from "../constants/app.constants.ts";
import {
  DEFAULT_QDRANT_URL,
  QdrantCollections,
} from "../constants/qdrant.constants.ts";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Load .env File
//
//   dotenv.config() reads .env from the current working directory and merges
//   values into process.env. It is silent if the file doesn't exist (correct
//   behaviour for production where env vars are injected by the platform).
//   We call this before the Zod schema parse so variables are available.
// ─────────────────────────────────────────────────────────────────────────────

loadDotEnv();

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Zod Schema Definition
//
//   Each field documents its source, purpose, and default.
//   Required fields have no default and will produce a validation error if absent.
//   Optional fields have sensible production-safe defaults.
// ─────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Application ──────────────────────────────────────────────────────────

  /**
   * Runtime environment selector.
   * Controls log format (JSON vs pretty), error detail verbosity, etc.
   */
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),

  /**
   * TCP port for the Express HTTP API server.
   * Coerced from string (all env vars arrive as strings) to number.
   */
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // ── AI Model Providers ────────────────────────────────────────────────────

  /**
   * Anthropic Claude API key.
   * Used by the LLM service for RCA and post-mortem generation.
   * Obtain at: https://console.anthropic.com/
   */
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY must not be empty")
    .startsWith("sk-ant-", {
      message: "ANTHROPIC_API_KEY must start with 'sk-ant-'",
    }),

  /**
   * OpenAI API key.
   * Used by the embeddings service (text-embedding-3-small).
   * Obtain at: https://platform.openai.com/api-keys
   */
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY must not be empty")
    .startsWith("sk-", {
      message: "OPENAI_API_KEY must start with 'sk-'",
    }),

  // ── Safety Layer ──────────────────────────────────────────────────────────

  /**
   * Enkrypt AI Guardrails API key.
   * Used to validate LLM-generated remediation actions before execution.
   * Obtain at: https://enkryptai.com/
   */
  ENKRYPTAI_GUARDRAILS_API_KEY: z
    .string()
    .min(1, "ENKRYPTAI_GUARDRAILS_API_KEY must not be empty"),

  // ── Vector Database ───────────────────────────────────────────────────────

  /**
   * Qdrant REST API base URL.
   * Local development: http://localhost:6333
   * Qdrant Cloud:      https://<cluster-id>.<region>.aws.cloud.qdrant.io
   */
  QDRANT_URL: z
    .url({ message: "QDRANT_URL must be a valid URL" })
    .default(DEFAULT_QDRANT_URL),

  /**
   * Optional Qdrant API key.
   * Required for Qdrant Cloud — leave empty for local Docker instance.
   */
  QDRANT_API_KEY: z.string().optional(),

  // ── OpenTelemetry ─────────────────────────────────────────────────────────

  /**
   * OTLP HTTP endpoint for trace export.
   * Examples: http://localhost:4318 (Jaeger), https://tempo.grafana.com
   * Leave unset to disable trace export (traces still collected in memory).
   */
  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .url()
    .optional(),

  /**
   * Service name reported to the OTLP backend.
   * Appears in trace UIs as the service identifier.
   */
  OTEL_SERVICE_NAME: z
    .string()
    .min(1)
    .default(APP_NAME),

  // ── Feature Flags ─────────────────────────────────────────────────────────

  /**
   * Enable automatic execution of APPROVED remediation actions.
   * When false (default), approved actions are logged but not executed.
   * Set to "true" only in environments where auto-remediation is safe.
   */
  ENABLE_AUTO_REMEDIATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  /**
   * Name of the Qdrant collection that stores historical incident vectors.
   * Defaults to the canonical PAST_INCIDENTS collection name.
   */
  QDRANT_COLLECTION_NAME: z
    .string()
    .min(1)
    .default(QdrantCollections.PAST_INCIDENTS),

  /**
   * OpenAI embedding model to use.
   * See app.constants.ts for available model identifiers and dimensions.
   */
  OPENAI_EMBEDDING_MODEL: z
    .enum([DEFAULT_OPENAI_EMBEDDING_MODEL, LARGE_OPENAI_EMBEDDING_MODEL])
    .default(DEFAULT_OPENAI_EMBEDDING_MODEL),

  /**
   * Anthropic Claude model identifier for RCA and post-mortem generation.
   * See app.constants.ts for the canonical model identifier.
   */
  ANTHROPIC_MODEL: z
    .string()
    .min(1)
    .default(DEFAULT_ANTHROPIC_MODEL),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Parse & Validate
//
//   safeParse() returns a discriminated union — we check .success before
//   accessing .data. If invalid, we print every error path and exit with
//   code 1 so the process never starts with broken config.
// ─────────────────────────────────────────────────────────────────────────────

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  // Format each Zod issue into a readable line.
  const issues = parseResult.error.issues
    .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  // Use console.error here explicitly — the Pino logger is not yet available
  // at config load time (it depends on env.NODE_ENV).
  console.error("❌ Environment validation failed:\n" + issues);
  console.error(
    "\nFix the issues above and restart. See .env.example for reference."
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Export Typed, Frozen Environment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The inferred TypeScript type of the validated environment object.
 * Import this type when you need to type-annotate env in services.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * The validated, typed, deeply frozen environment configuration.
 *
 * USAGE:
 *   import { env } from '../config/env.ts';
 *   const client = new QdrantClient({ url: env.QDRANT_URL });
 *
 * This object is frozen — mutating any field will throw in strict mode.
 */
export const env: Readonly<Env> = Object.freeze(parseResult.data);

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Environment Helper Functions
//
//   These small helpers eliminate scattered `env.NODE_ENV === "..."` checks
//   throughout the codebase and make conditionals read like English.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when running in local development mode. */
export const isDevelopment = (): boolean => env.NODE_ENV === "development";

/** Returns true when running in production. */
export const isProduction = (): boolean => env.NODE_ENV === "production";

/** Returns true when running in the test runner. */
export const isTest = (): boolean => env.NODE_ENV === "test";

/** Returns true when automatic remediation is enabled. */
export const isAutoRemediationEnabled = (): boolean =>
  env.ENABLE_AUTO_REMEDIATION;

/** Returns true when an OTLP export endpoint is configured. */
export const isTracingEnabled = (): boolean =>
  env.OTEL_EXPORTER_OTLP_ENDPOINT !== undefined;
