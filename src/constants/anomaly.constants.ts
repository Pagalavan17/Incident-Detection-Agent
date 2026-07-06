/**
 * src/constants/anomaly.constants.ts
 *
 * PURPOSE:
 *   Defines all reusable detection thresholds and configuration constants
 *   for the anomaly detection service. Business logic in the detector reads
 *   from here — never from inline magic numbers.
 *
 *   Without this file, values like "80% CPU threshold" would be buried inside
 *   detection functions, making them invisible in code review and impossible
 *   to tune without modifying business logic.
 *
 * WHERE IT WILL BE USED:
 *   • src/services/anomaly/detector.ts   — threshold comparisons
 *   • src/services/anomaly/scorer.ts     — anomaly confidence scoring
 *   • src/mastra/tools/anomalyTool.ts   — tool parameter defaults
 *   • tests/anomaly/                     — threshold-based test assertions
 *
 * HOW TO VERIFY:
 *   import { CPU_THRESHOLD, ERROR_RATE_THRESHOLD } from '../constants/anomaly.constants.ts';
 *   console.assert(CPU_THRESHOLD === 80);
 *   npm run typecheck  →  zero errors
 *
 * DEPENDENCY RULE:
 *   This file MUST NOT import from any other src/ module.
 *   It contains only numeric and string literal constants.
 *   No detection logic. No imports.
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Resource Utilisation Thresholds (Percentage)
//
//   Values represent percentage of total capacity [0–100].
//   Exceeding these values for a sustained window triggers an anomaly signal.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CPU utilisation threshold (percentage).
 * Sustained CPU above this level for CPU_SUSTAINED_WINDOW_MS is anomalous.
 * Industry standard: 80% sustained = significant risk of queuing / throttling.
 */
export const CPU_THRESHOLD = 80 as const;

/**
 * Memory utilisation threshold (percentage of available heap/RSS).
 * Above this level, garbage collection pressure and OOM risk are elevated.
 */
export const MEMORY_THRESHOLD = 85 as const;

/**
 * Disk I/O utilisation threshold (percentage of disk bandwidth).
 * High disk I/O often precedes database slowdowns and write failures.
 */
export const DISK_IO_THRESHOLD = 90 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Error Rate Thresholds (Ratio)
//
//   Values represent a ratio of error responses to total requests [0.0–1.0].
//   For example: 0.05 = 5% error rate.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HTTP 5xx error rate threshold (ratio of 5xx to total HTTP requests).
 * A 5% error rate represents a significant user-facing degradation.
 */
export const ERROR_RATE_THRESHOLD = 0.05 as const;

/**
 * Stricter error rate threshold used for critical services (payments, auth).
 * A 1% error rate on these paths warrants immediate attention.
 */
export const CRITICAL_SERVICE_ERROR_RATE_THRESHOLD = 0.01 as const;

/**
 * Log-level error rate threshold.
 * Ratio of ERROR/CRITICAL log entries to total log volume.
 * Used when HTTP metrics are unavailable (e.g. background workers).
 */
export const LOG_ERROR_RATE_THRESHOLD = 0.10 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Latency Thresholds (Milliseconds)
//
//   P99 latency is the primary latency metric. P50/P95 thresholds are also
//   provided for balanced anomaly scoring.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * P99 latency threshold in milliseconds.
 * Requests taking longer than this at P99 indicate systemic slowdown.
 * Threshold: 1000ms (1 second) — standard SLO boundary for most web services.
 */
export const LATENCY_THRESHOLD = 1000 as const;

/**
 * P95 latency threshold in milliseconds.
 * A softer signal — use to detect degrading trends before P99 breaches.
 */
export const LATENCY_P95_THRESHOLD = 500 as const;

/**
 * P50 (median) latency threshold in milliseconds.
 * If the median exceeds this, the service is slow for the average user.
 */
export const LATENCY_P50_THRESHOLD = 200 as const;

/**
 * Database query latency threshold in milliseconds.
 * Queries exceeding this suggest missing indices or lock contention.
 */
export const DB_QUERY_LATENCY_THRESHOLD = 500 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Request Rate Thresholds
//
//   Used to detect both traffic spikes (potential DoS / viral events)
//   and traffic drops (service unavailability / upstream failures).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request rate spike multiplier.
 * If current RPS exceeds baseline * this value, a SPIKE anomaly is raised.
 * Example: 3.0 = request rate is 3× higher than baseline → anomalous.
 */
export const REQUEST_RATE_THRESHOLD = 3.0 as const;

/**
 * Request rate drop ratio.
 * If current RPS falls below baseline * this value, a DROP anomaly is raised.
 * Example: 0.2 = request rate is less than 20% of baseline → anomalous.
 */
export const REQUEST_RATE_DROP_THRESHOLD = 0.2 as const;

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Anomaly Detection Windows (Milliseconds)
//
//   Detection is window-based. A metric must breach a threshold for the
//   duration of the sustained window to avoid false positives from transient spikes.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default observation window for anomaly detection in milliseconds.
 * Metrics are evaluated over this window before raising a signal.
 * 5 minutes: long enough to avoid transient spikes, short enough to catch
 * real incidents quickly.
 */
export const DEFAULT_DETECTION_WINDOW_MS = 300_000 as const; // 5 minutes

/**
 * Minimum sustained breach duration before raising an anomaly signal.
 * A threshold breach lasting less than this is considered transient noise.
 */
export const CPU_SUSTAINED_WINDOW_MS = 120_000 as const; // 2 minutes

/**
 * Silence detection window — how long a normally active service must be
 * silent before a SILENCE anomaly is raised.
 */
export const SILENCE_DETECTION_WINDOW_MS = 180_000 as const; // 3 minutes

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Anomaly Confidence Scoring
//
//   The anomaly detection service assigns a confidence score [0.0–1.0] to
//   each signal. These thresholds determine when a signal is strong enough
//   to open an incident vs. just log a warning.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimum confidence score required to open a full incident.
 * Signals below this threshold are logged as warnings but do not enter
 * the incident pipeline.
 */
export const MIN_INCIDENT_CONFIDENCE = 0.60 as const;

/**
 * Confidence threshold for HIGH severity classification.
 * Signals at or above this confidence are classified as at least P2.
 */
export const HIGH_CONFIDENCE_THRESHOLD = 0.85 as const;

/**
 * Confidence threshold for CRITICAL severity auto-escalation.
 * At or above this, the incident is immediately escalated to P1.
 */
export const CRITICAL_CONFIDENCE_THRESHOLD = 0.95 as const;
