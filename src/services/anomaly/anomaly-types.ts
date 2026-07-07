/**
 * src/services/anomaly/anomaly-types.ts
 *
 * PURPOSE:
 *   Defines the types and interfaces for the rule-based anomaly detection service.
 */

import type { NormalisedLogEntry } from "../../types/log";
import type { AnomalySignal } from "../../contracts/incident.contract";
import type { AnomalyThresholds } from "../../constants/anomaly-thresholds";
import type { IncidentContext } from "../../models/IncidentContext";

/**
 * Interface representing a deterministic operational anomaly detection rule.
 */
export interface AnomalyRule {
  /** Descriptive name of the rule (e.g., "High CPU Utilisation") */
  readonly name: string;
  /** Unique code identifying the rule (e.g., "HIGH_CPU") */
  readonly code: string;
  /**
   * Evaluates normalized log entries against configured thresholds.
   * Returns a list of detected anomaly signals.
   */
  evaluate(
    entries: ReadonlyArray<NormalisedLogEntry>,
    thresholds: AnomalyThresholds
  ): ReadonlyArray<AnomalySignal>;
}

/**
 * Extended IncidentContext carrying the optional collection of detected anomalies.
 */
export interface IncidentContextWithAnomalies extends IncidentContext {
  readonly anomalies?: ReadonlyArray<AnomalySignal>;
}
