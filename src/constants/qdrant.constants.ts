/**
 * src/constants/qdrant.constants.ts
 *
 * PURPOSE:
 *   Single source of truth for every Qdrant-related constant in the system.
 *   Defines collection names, vector configuration, payload field keys,
 *   and search defaults.
 *
 *   Without this file, collection names like "incident_embeddings" would be
 *   scattered across setupQdrant.ts, seedQdrant.ts, and retrieval services.
 *   A single rename would require tracking down every occurrence.
 *   With this file, a rename is a one-line change here.
 *
 * WHERE IT WILL BE USED:
 *   • src/services/qdrant/client.ts          — QdrantClient initialisation
 *   • src/services/qdrant/collections.ts     — createCollection() calls
 *   • src/services/qdrant/upsert.ts          — payload field keys when indexing
 *   • src/services/retrieval/               — similarity search query builders
 *   • src/services/embeddings/              — vector dimension assertions
 *   • src/scripts/setupQdrant.ts            — collection bootstrap script
 *   • src/scripts/seedQdrant.ts             — historical incident seeder
 *   • src/config/env.ts                     — QDRANT_COLLECTION_NAME default
 *
 * HOW TO VERIFY:
 *   import { QdrantCollections, QdrantPayloadKeys } from '../constants/qdrant.constants.ts';
 *   console.assert(QdrantCollections.PAST_INCIDENTS === 'past_incidents');
 *   npm run typecheck  →  zero errors
 *
 * DEPENDENCY RULE:
 *   This file MUST NOT import from any other src/ module.
 *   It contains only literal values — no Qdrant SDK imports.
 *   The Qdrant SDK is used ONLY in src/services/qdrant/.
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Collection Names
//
//   Each collection serves a distinct semantic purpose.
//   Use snake_case to match Qdrant's naming conventions.
//   NEVER hardcode these strings outside this file.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Names of every Qdrant collection used by this application.
 *
 * PAST_INCIDENTS  — Embeddings of resolved historical incidents.
 *                   Used for semantic similarity search during the RCA step.
 *                   Each point stores: incident summary + metadata payload.
 *
 * RUNBOOKS        — Embeddings of operational runbook entries.
 *                   Used to retrieve relevant runbook sections for a given
 *                   anomaly signal during remediation suggestion.
 *
 * POSTMORTEMS     — Embeddings of completed post-mortem documents.
 *                   Used for long-term institutional memory and trend analysis.
 */
export const QdrantCollections = {
  PAST_INCIDENTS: "past_incidents",
  RUNBOOKS: "runbooks",
  POSTMORTEMS: "post_mortems",
} as const;

/** Union type of all valid Qdrant collection names. */
export type QdrantCollectionName =
  (typeof QdrantCollections)[keyof typeof QdrantCollections];

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Default Vector Configuration
//
//   These values are used when creating collections and when asserting that
//   incoming embeddings match the expected dimensionality.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default embedding vector dimensionality.
 *
 * 1536 matches OpenAI text-embedding-3-small output dimensions.
 * If switching to text-embedding-3-large, update this to 3072 and
 * recreate all collections.
 */
export const DEFAULT_VECTOR_SIZE = 1536 as const;

/**
 * Alternative vector size for text-embedding-3-large.
 * Only used when OPENAI_EMBEDDING_MODEL is set to the large model.
 */
export const LARGE_VECTOR_SIZE = 3072 as const;

/**
 * Default distance metric for vector similarity search.
 *
 * "Cosine" is used for text embeddings because it measures the angle
 * between vectors regardless of magnitude — ideal for semantic similarity.
 * Alternatives: "Dot" (inner product), "Euclid" (L2 distance).
 */
export const DEFAULT_DISTANCE = "Cosine" as const;

/** Union of supported Qdrant distance metrics. */
export type QdrantDistance = "Cosine" | "Dot" | "Euclid" | "Manhattan";

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Payload Field Keys
//
//   When upserting points into Qdrant, metadata is stored in the `payload`
//   object. These keys must be consistent between write (upsert) and read
//   (filter/query) operations.
//
//   Using constants prevents the classic bug where an upsert writes
//   payload["service"] but a filter reads payload["serviceName"].
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Qdrant payload field key names.
 * Used in both upsert payloads and filter expressions.
 *
 * SERVICE      — The name of the service that generated the incident.
 *                Example: "payments-api"
 *
 * SEVERITY     — The incident severity level.
 *                Example: "CRITICAL" | "ERROR" | "WARN"
 *
 * ROOT_CAUSE   — One-sentence root cause summary stored for retrieval context.
 *                Example: "Memory leak in connection pool"
 *
 * TIMESTAMP    — Unix epoch milliseconds when the incident occurred.
 *                Stored as a number for range filtering.
 *
 * STATUS       — The terminal lifecycle status of the stored incident.
 *                Example: "RESOLVED" | "CLOSED"
 *
 * VERSION      — Schema version of this payload — allows safe migrations.
 *                Increment when the payload structure changes.
 *
 * INCIDENT_ID  — The application-level IncidentId for cross-referencing.
 *
 * COLLECTION   — Internal tag used when querying across multiple collections.
 *
 * ENVIRONMENT  — The deployment environment the incident occurred in.
 *                Example: "production" | "staging"
 *
 * PRIORITY     — The P1–P4 priority tier of the incident.
 */
export const QdrantPayloadKeys = {
  SERVICE: "service",
  SEVERITY: "severity",
  ROOT_CAUSE: "root_cause",
  TIMESTAMP: "timestamp",
  STATUS: "status",
  VERSION: "version",
  INCIDENT_ID: "incident_id",
  COLLECTION: "collection",
  ENVIRONMENT: "environment",
  PRIORITY: "priority",
} as const;

/** Union type of all valid Qdrant payload key names. */
export type QdrantPayloadKey =
  (typeof QdrantPayloadKeys)[keyof typeof QdrantPayloadKeys];

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Search & Retrieval Defaults
//
//   Default parameters for similarity search operations.
//   Callers may override these; they exist to provide sensible production
//   defaults without magic numbers in the retrieval service.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default number of similar incidents to retrieve per search.
 * Retrieving 5 provides enough context for the LLM RCA without
 * exceeding the context window or increasing prompt costs significantly.
 */
export const DEFAULT_SEARCH_LIMIT = 5 as const;

/**
 * Minimum cosine similarity score [0.0–1.0] for a result to be included.
 * Results below this threshold are too dissimilar to be useful context.
 */
export const MIN_SIMILARITY_SCORE = 0.70 as const;

/**
 * Maximum number of candidate points Qdrant evaluates during ANN search.
 * Higher values improve accuracy at the cost of latency.
 * 128 is the Qdrant-recommended default for most use cases.
 */
export const DEFAULT_HNSW_EF = 128 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Collection Schema Version
//
//   Stored in every payload to allow safe schema migrations.
//   When the payload structure changes, increment this version and write
//   a migration script in src/scripts/.
// ─────────────────────────────────────────────────────────────────────────────

/** Current payload schema version stored in every Qdrant point. */
export const PAYLOAD_SCHEMA_VERSION = 1 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Default Qdrant Connection Settings
// ─────────────────────────────────────────────────────────────────────────────

/** Default Qdrant REST API URL for local Docker development. */
export const DEFAULT_QDRANT_URL = "http://localhost:6333" as const;

/** Default Qdrant gRPC port (used if switching from REST to gRPC client). */
export const DEFAULT_QDRANT_GRPC_PORT = 6334 as const;

/** Default Qdrant REST port. */
export const DEFAULT_QDRANT_REST_PORT = 6333 as const;

/** Primary collection name — mirrors env default for backward compat. */
export const PRIMARY_COLLECTION_NAME = QdrantCollections.PAST_INCIDENTS;
