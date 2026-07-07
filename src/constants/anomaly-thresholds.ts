/**
 * src/constants/anomaly-thresholds.ts
 *
 * PURPOSE:
 *   Defines the threshold limits used by the rule-based anomaly detection service.
 *   Consolidates threshold constants so they can be easily tweaked without
 *   modifying detection rules or engine logic.
 *
 * DEPENDENCY RULE:
 *   Imports nothing. Pure literal constants.
 */

export interface AnomalyThresholds {
  /** CPU utilization threshold (percentage [0-100]) */
  readonly cpuPercentLimit: number;
  /** Memory utilization threshold (percentage [0-100]) */
  readonly memoryPercentLimit: number;
  /** Error rate ratio threshold (ratio [0.0-1.0], e.g., 0.05 = 5%) */
  readonly errorRateLimit: number;
  /** Minimum number of logs required to calculate an error rate spike */
  readonly minLogsForErrorRate: number;
  /** Authentication failure count limit within the log batch */
  readonly authFailureLimit: number;
  /** Database query latency limit (milliseconds) */
  readonly dbQueryLatencyLimitMs: number;
  /** Database timeout/deadlock burst count limit within the log batch */
  readonly dbTimeoutLimit: number;
  /** HTTP / API latency threshold (milliseconds) */
  readonly apiLatencyLimitMs: number;
  /** Count limit for requests exceeding the API latency threshold */
  readonly slowRequestCountLimit: number;
  /** Service crash event count limit within the log batch */
  readonly serviceCrashLimit: number;
  /** Disk utilization threshold (percentage [0-100]) */
  readonly diskUsageLimitPercent: number;
  /** Network packet loss percentage threshold (percentage [0-100]) */
  readonly networkPacketLossLimitPercent: number;
}

/**
 * Default threshold values aligned with industry standard practices
 * and the synthetic generator configuration.
 */
export const DEFAULT_ANOMALY_THRESHOLDS: AnomalyThresholds = {
  cpuPercentLimit: 80,
  memoryPercentLimit: 85,
  errorRateLimit: 0.05,
  minLogsForErrorRate: 5,
  authFailureLimit: 5,
  dbQueryLatencyLimitMs: 500,
  dbTimeoutLimit: 3,
  apiLatencyLimitMs: 1000,
  slowRequestCountLimit: 3,
  serviceCrashLimit: 1,
  diskUsageLimitPercent: 90,
  networkPacketLossLimitPercent: 5,
};
