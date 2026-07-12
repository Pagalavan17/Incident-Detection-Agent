/**
 * src/services/logs/normalizer.ts
 *
 * PURPOSE:
 *   Normalize parsed and validated log entries into the canonical
 *   NormalisedLogEntry format used throughout the system.
 */

import { randomUUID } from "node:crypto";
import type {
  RawLogEntry,
  NormalisedLogEntry,
  LogSource,
} from "../../types/log";
import { Severity, toISODateString, epochMsToDate } from "../../types/common";
import type { EpochMs } from "../../types/common";

export interface NormaliseBatchResult {
  readonly entries: ReadonlyArray<NormalisedLogEntry>;
}

/**
 * LogNormaliser
 *
 * Converts parsed and validated logs into the canonical NormalisedLogEntry format.
 */
export class LogNormaliser {
  /**
   * Normalize a single parsed log entry into NormalisedLogEntry format.
   */
  private normalizeEntry(
    parsed: Readonly<Record<string, unknown>>,
    raw: RawLogEntry,
    source: LogSource = "JSON_FILE" as LogSource
  ): NormalisedLogEntry {
    const timestamp = (parsed["timestamp"] as number) || Date.now();
    const severity = this.parseSeverity(
      String(parsed["level"] || "INFO")
    );
    const message = String(parsed["message"] || "");
    const service = String(parsed["service"] || "unknown");
    const host = String(parsed["host"] || "unknown");
    const correlationId = parsed["correlationId"]
      ? String(parsed["correlationId"]) as any
      : undefined;
    const environment = parsed["environment"]
      ? String(parsed["environment"])
      : undefined;

    // Extract any additional metadata
    const metadata = this.extractMetadata(parsed);

    return {
      id: randomUUID(),
      source,
      timestamp: timestamp as EpochMs,
      timestampIso: toISODateString(epochMsToDate(timestamp as EpochMs)),
      severity,
      message,
      service,
      host,
      correlationId,
      environment,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      raw,
    };
  }

  /**
   * Normalize a batch of validated log entries.
   */
  normaliseBatch(
    validEntries: ReadonlyArray<{ parsed: Readonly<Record<string, unknown>>; index: number }>
  ): NormaliseBatchResult {
    // For now, we don't have access to the raw entries in this batch format,
    // so we'll reconstruct them from the parsed data
    const entries: NormalisedLogEntry[] = validEntries.map((entry) => {
      const raw: RawLogEntry = entry.parsed as RawLogEntry;
      return this.normalizeEntry(entry.parsed, raw, "JSON_FILE" as LogSource);
    });

    return {
      entries: Object.freeze(entries),
    };
  }

  /**
   * Extract additional metadata from parsed log.
   */
  private extractMetadata(
    parsed: Readonly<Record<string, unknown>>
  ): Readonly<Record<string, unknown>> {
    const metadata: Record<string, unknown> = {};

    // Common fields to include as metadata
    const metadataKeys = [
      "statusCode",
      "status_code",
      "errorCode",
      "error_code",
      "duration",
      "latency",
      "userId",
      "user_id",
      "requestId",
      "request_id",
      "exception",
      "error",
      "stack",
      "context",
    ];

    metadataKeys.forEach((key) => {
      if (key in parsed) {
        metadata[key] = parsed[key as keyof typeof parsed];
      }
    });

    return Object.freeze(metadata);
  }

  /**
   * Parse a severity string into a Severity enum value.
   */
  private parseSeverity(levelStr: string): Severity {
    const normalized = levelStr.toUpperCase();
    if (normalized.includes("CRIT") || normalized.includes("FATAL")) {
      return Severity.CRITICAL;
    }
    if (normalized.includes("ERR")) {
      return Severity.ERROR;
    }
    if (normalized.includes("WARN")) {
      return Severity.WARN;
    }
    if (normalized.includes("DEBUG")) {
      return Severity.DEBUG;
    }
    return Severity.INFO;
  }
}
