/**
 * src/services/logs/parser.ts
 *
 * PURPOSE:
 *   Parse raw log entries from various sources into a common format.
 *   Handles extraction of structured fields from raw log payloads.
 */

import type { RawLogEntry } from "../../types/log";

export interface ParseResult {
  readonly parsed: Readonly<Record<string, unknown>>;
  readonly raw: RawLogEntry;
}

export interface ParseBatchResult {
  readonly successes: ReadonlyArray<ParseResult>;
  readonly successCount: number;
  readonly failureCount: number;
  readonly total: number;
}

/**
 * LogParser
 *
 * Parses raw log entries and extracts structured fields.
 */
export class LogParser {
  /**
   * Parse a raw log entry and extract common fields.
   */
  private parseEntry(rawEntry: RawLogEntry): Readonly<Record<string, unknown>> {
    const raw = rawEntry as any;
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const parsed: Record<string, unknown> = {};

    // Extract timestamp
    if ("timestamp" in raw && typeof raw.timestamp === "number") {
      parsed["timestamp"] = raw.timestamp;
    } else if ("@timestamp" in raw) {
      const ts = raw["@timestamp"];
      if (typeof ts === "string") {
        parsed["timestamp"] = new Date(ts).getTime();
      } else if (typeof ts === "number") {
        parsed["timestamp"] = ts;
      }
    } else if ("timestamp" in raw && typeof raw.timestamp === "string") {
      try {
        parsed["timestamp"] = new Date(raw.timestamp as string).getTime();
      } catch {
        parsed["timestamp"] = Date.now();
      }
    }

    // Extract message
    if ("message" in raw && typeof raw.message === "string") {
      parsed["message"] = raw.message;
    } else if ("msg" in raw && typeof raw.msg === "string") {
      parsed["message"] = raw.msg;
    } else if ("log" in raw && typeof raw.log === "string") {
      parsed["message"] = raw.log;
    }

    // Extract severity/level
    if ("level" in raw && typeof raw.level === "string") {
      parsed["level"] = raw.level;
    } else if ("severity" in raw && typeof raw.severity === "string") {
      parsed["level"] = raw.severity;
    }

    // Extract service
    if ("service" in raw && typeof raw.service === "string") {
      parsed["service"] = raw.service;
    } else if ("service_name" in raw && typeof raw.service_name === "string") {
      parsed["service"] = raw.service_name;
    }

    // Extract host
    if ("host" in raw && typeof raw.host === "string") {
      parsed["host"] = raw.host;
    } else if ("hostname" in raw && typeof raw.hostname === "string") {
      parsed["host"] = raw.hostname;
    }

    // Extract correlation ID
    if ("correlationId" in raw && typeof raw.correlationId === "string") {
      parsed["correlationId"] = raw.correlationId;
    } else if ("correlation_id" in raw && typeof raw.correlation_id === "string") {
      parsed["correlationId"] = raw.correlation_id;
    } else if ("trace_id" in raw && typeof raw.trace_id === "string") {
      parsed["correlationId"] = raw.trace_id;
    }

    return Object.freeze(parsed);
  }

  /**
   * Parse a batch of raw log entries.
   * Returns successes and failures separately for resilient processing.
   */
  parseBatch(raws: ReadonlyArray<RawLogEntry>): ParseBatchResult {
    const successes: ParseResult[] = [];
    let failureCount = 0;

    raws.forEach((raw) => {
      try {
        const parsed = this.parseEntry(raw);
        // Ensure it's a valid object
        if (parsed && typeof parsed === "object") {
          successes.push({ parsed, raw });
        } else {
          failureCount++;
        }
      } catch {
        failureCount++;
      }
    });

    return {
      successes: Object.freeze(successes),
      successCount: successes.length,
      failureCount,
      total: raws.length,
    };
  }
}
