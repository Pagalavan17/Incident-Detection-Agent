/**
 * src/config/env.ts
 *
 * PURPOSE:
 *   Single source of truth for all environment variables.
 *   Loads .env via dotenv, validates configuration with Zod, and exports a
 *   typed, frozen `env` object.
 *
 * STARTUP BEHAVIOR (two-tier validation):
 *
 *   TIER 1 — Core settings (PORT, NODE_ENV):
 *     Validated eagerly at startup. The process exits immediately if these are
 *     missing or invalid. The server CANNOT run without them.
 *
 *   TIER 2 — Provider settings (API keys, QDRANT_URL):
 *     Parsed at startup but NOT required. Missing keys do not prevent the
 *     server from starting. Each service validates its own required key at
 *     call-time and returns a typed AppError if the key is absent.
 *     This enables local development without all provider credentials.
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
 *   • isProviderConfigured()    — services call this to produce a typed
 *     AppError rather than crashing when a key is absent.
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
} from "../constants/app.constants";
import {
  DEFAULT_QDRANT_URL,
  QdrantCollections,
} from "../constants/qdrant.constants";

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
// § 2. Tier 1 — Core Schema (fail-fast)
//
//   Only the fields without which the HTTP server literally cannot run.
//   A validation failure here exits the process immediately with a clear
//   error message. No service-level logic can substitute for these.
// ─────────────────────────────────────────────────────────────────────────────

const coreSchema = z.object({
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

  /**
   * Service name reported to the OTLP backend.
   */
  OTEL_SERVICE_NAME: z.string().min(1).default(APP_NAME),

  /**
   * Enable automatic execution of APPROVED remediation actions.
   */
  ENABLE_AUTO_REMEDIATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  /**
   * Name of the Qdrant collection that stores historical incident vectors.
   */
  QDRANT_COLLECTION_NAME: z
    .string()
    .min(1)
    .default(QdrantCollections.PAST_INCIDENTS),

  /**
   * OpenAI embedding model to use.
   */
  OPENAI_EMBEDDING_MODEL: z
    .enum([DEFAULT_OPENAI_EMBEDDING_MODEL, LARGE_OPENAI_EMBEDDING_MODEL])
    .default(DEFAULT_OPENAI_EMBEDDING_MODEL),

  /**
   * Anthropic Claude model identifier.
   */
  ANTHROPIC_MODEL: z.string().min(1).default(DEFAULT_ANTHROPIC_MODEL),
});

const coreResult = coreSchema.safeParse(process.env);

if (!coreResult.success) {
  const issues = coreResult.error.issues
    .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error("❌ Core environment validation failed:\n" + issues);
  console.error(
    "\nFix the issues above and restart. See .env.example for reference."
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Tier 2 — Provider Schema (best-effort, no process.exit)
//
//   API keys and external service URLs are desirable but not required to start
//   the server. Each individual service validates its own key at call-time
//   and returns Err(AppError) with code ENV_VALIDATION_FAILED when absent.
//
//   Keys are validated for format IF present, but presence itself is optional.
// ─────────────────────────────────────────────────────────────────────────────

const providerSchema = z.object({
  /**
   * Anthropic Claude API key.
   * Required by: root-cause, remediation, guardrails, post-mortem agents.
   * Obtain at: https://console.anthropic.com/
   */
  ANTHROPIC_API_KEY: z
    .string()
    .min(1)
    .startsWith("sk-ant-", {
      message: "ANTHROPIC_API_KEY must start with 'sk-ant-'",
    })
    .optional(),

  /**
   * OpenAI API key.
   * Required by: embeddings service (text-embedding-3-small).
   * Obtain at: https://platform.openai.com/api-keys
   */
  OPENAI_API_KEY: z
    .string()
    .min(1)
    .startsWith("sk-", {
      message: "OPENAI_API_KEY must start with 'sk-'",
    })
    .optional(),

  /**
   * Enkrypt AI Guardrails API key.
   * Required by: guardrails validation service.
   * Obtain at: https://enkryptai.com/
   */
  ENKRYPTAI_GUARDRAILS_API_KEY: z.string().min(1).optional(),

  /**
   * Qdrant REST API base URL.
   * Has a sensible local-dev default — absence does not block startup.
   */
  QDRANT_URL: z
    .url({ message: "QDRANT_URL must be a valid URL" })
    .default(DEFAULT_QDRANT_URL),

  /**
   * Optional Qdrant API key.
   * Required for Qdrant Cloud — leave empty for local Docker instance.
   */
  QDRANT_API_KEY: z.string().optional(),

  /**
   * OTLP HTTP endpoint for trace export.
   */
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

// Parse provider config; never exit on failure — log warnings only.
const providerResult = providerSchema.safeParse(process.env);

const providerEnv = providerResult.success
  ? providerResult.data
  : (() => {
      // Log format issues as warnings (not errors) — server still starts.
      const issues = providerResult.error.issues
        .map((i) => `  ⚠  ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      console.warn(
        "⚠  Provider environment validation warnings (server will still start):\n" +
        issues +
        "\n   Some AI features will be unavailable until keys are configured.\n"
      );
      // Return safe defaults: all optional fields undefined, QDRANT_URL with default.
      return {
        ANTHROPIC_API_KEY: undefined,
        OPENAI_API_KEY: undefined,
        ENKRYPTAI_GUARDRAILS_API_KEY: undefined,
        QDRANT_URL: DEFAULT_QDRANT_URL,
        QDRANT_API_KEY: undefined,
        OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
      } as z.infer<typeof providerSchema>;
    })();

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Export Typed, Frozen Environment
// ─────────────────────────────────────────────────────────────────────────────

/** The merged, fully-typed environment shape. */
export type Env = z.infer<typeof coreSchema> & z.infer<typeof providerSchema>;

/**
 * The validated, typed, deeply frozen environment configuration.
 *
 * Provider keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, ENKRYPTAI_GUARDRAILS_API_KEY)
 * are typed as `string | undefined`. Services MUST call `requireProviderKey()`
 * (or their own equivalent guard) before using these values.
 *
 * USAGE:
 *   import { env } from '../config/env';
 *   const url = env.QDRANT_URL; // always a string
 *   const key = env.ANTHROPIC_API_KEY; // string | undefined
 */
export const env: Readonly<Env> = Object.freeze({
  ...coreResult.data,
  ...providerEnv,
});

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Provider Configuration Helpers
//
//   Services call these at call-time (not module load) to check whether their
//   required provider is configured. Returns the key string or throws a
//   typed AppError that callers can wrap in Err().
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes which external provider services have their keys configured.
 * Exported for the /ready health endpoint.
 */
export interface ProviderStatus {
  readonly anthropic: boolean;
  readonly openai: boolean;
  readonly enkrypt: boolean;
  readonly qdrant: boolean;
}

/**
 * Returns a snapshot of which providers are currently configured.
 * Does NOT test connectivity — only checks key presence.
 */
export const getProviderStatus = (): ProviderStatus => ({
  anthropic: env.ANTHROPIC_API_KEY !== undefined,
  openai: env.OPENAI_API_KEY !== undefined,
  enkrypt: env.ENKRYPTAI_GUARDRAILS_API_KEY !== undefined,
  // Qdrant always has a URL (default), but flag it only if explicitly set
  qdrant: env.QDRANT_URL !== undefined,
});

/**
 * Assert that a named provider key is configured.
 * Returns the key string on success.
 * Throws a plain object matching AppError shape on failure.
 *
 * Services call this at the TOP of every async method that needs the key:
 *
 * @example
 *   const key = requireProviderKey("ANTHROPIC_API_KEY", "Anthropic");
 *   // key is string (not undefined) past this point
 */
export const requireProviderKey = (
  keyName: keyof Pick<
    Env,
    "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "ENKRYPTAI_GUARDRAILS_API_KEY"
  >,
  providerLabel: string
): string => {
  const value = env[keyName];
  if (value === undefined) {
    throw {
      code: "ENV_VALIDATION_FAILED" as const,
      message:
        `${providerLabel} is not configured. ` +
        `Set the ${keyName} environment variable to enable this feature. ` +
        `See .env.example for reference.`,
    };
  }
  return value;
};

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Environment Helper Functions
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
