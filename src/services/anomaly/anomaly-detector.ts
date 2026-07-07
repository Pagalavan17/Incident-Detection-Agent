/**
 * src/services/anomaly/anomaly-detector.ts
 *
 * PURPOSE:
 *   Deterministic Rule-Based Anomaly Detection Engine.
 *   Evaluates normalized log entries or incident context against configurable
 *   operational thresholds to detect CPU, Memory, Latency, Network, Disk,
 *   Authentication, Database, and Service crash anomalies.
 *
 * DESIGN DECISIONS:
 *   • Strictly deterministic, pure-logic rules (no LLMs or AI models).
 *   • Inputs are never mutated (immutable design).
 *   • Overloaded API to accept either raw normalized log lists or full incident contexts.
 */

import type { NormalisedLogEntry } from "../../types/log.ts";
import type { IncidentContext } from "../../models/IncidentContext.ts";
import type { AnomalySignal } from "../../contracts/incident.contract.ts";
import type { AnomalyThresholds } from "../../constants/anomaly-thresholds.ts";
import { DEFAULT_ANOMALY_THRESHOLDS } from "../../constants/anomaly-thresholds.ts";
import { ALL_RULES } from "./anomaly-rules.ts";
import type { IncidentContextWithAnomalies } from "./anomaly-types.ts";

export class AnomalyDetector {
  private readonly thresholds: AnomalyThresholds;

  /**
   * Initialises the detector with configurable thresholds.
   * Defaults to DEFAULT_ANOMALY_THRESHOLDS if not provided.
   */
  constructor(thresholds: AnomalyThresholds = DEFAULT_ANOMALY_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Analytically evaluates a list of normalized logs.
   * Returns an array of detected anomaly signals.
   *
   * @param logs - ReadonlyArray of NormalisedLogEntry objects.
   * @returns ReadonlyArray of AnomalySignal objects.
   */
  detect(logs: ReadonlyArray<NormalisedLogEntry>): ReadonlyArray<AnomalySignal>;

  /**
   * Evaluates the logs associated with the incident context.
   * Returns a new, enriched, immutable IncidentContext containing the detected anomalies.
   *
   * @param context - The existing IncidentContext.
   * @returns A new IncidentContext enriched with detected anomalies.
   */
  detect(context: IncidentContext): IncidentContextWithAnomalies;

  /**
   * Overloaded implementation.
   */
  detect(
    input: IncidentContext | ReadonlyArray<NormalisedLogEntry>
  ): IncidentContextWithAnomalies | ReadonlyArray<AnomalySignal> {
    if (Array.isArray(input)) {
      return this.detectLogs(input as ReadonlyArray<NormalisedLogEntry>);
    } else {
      return this.detectContext(input as IncidentContext);
    }
  }

  /**
   * Evaluates rules against normalized logs list.
   */
  private detectLogs(logs: ReadonlyArray<NormalisedLogEntry>): ReadonlyArray<AnomalySignal> {
    const anomalies: AnomalySignal[] = [];
    for (const rule of ALL_RULES) {
      const detected = rule.evaluate(logs, this.thresholds);
      anomalies.push(...detected);
    }
    return anomalies;
  }

  /**
   * Evaluates logs inside an IncidentContext and returns a new context enriched with anomalies.
   */
  private detectContext(context: IncidentContext): IncidentContextWithAnomalies {
    const logs = context.logBatch?.entries ?? [];
    const anomalies = this.detectLogs(logs);

    // Enrich the context by adding detected anomaly signals while keeping it immutable
    return {
      ...context,
      anomalies,
    };
  }
}
