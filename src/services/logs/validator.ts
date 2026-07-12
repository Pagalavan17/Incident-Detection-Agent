/**
 * src/services/logs/validator.ts
 *
 * PURPOSE:
 *   Validate parsed log entries against expected schemas.
 *   Ensures that parsed logs have required fields before normalization.
 */

import type { AppError } from "../../types/common";
import { makeError } from "../../types/common";

export interface ValidationEntry {
  readonly parsed: Readonly<Record<string, unknown>>;
  readonly index: number;
}

export interface ValidBatchResult {
  readonly valid: ReadonlyArray<ValidationEntry>;
  readonly validCount: number;
  readonly invalidCount: number;
}

/**
 * LogValidator
 *
 * Validates parsed log entries.
 */
export class LogValidator {
  /**
   * Validate a single log entry for required fields.
   * Returns undefined if valid, or an AppError if invalid.
   */
  private validateEntry(log: Readonly<Record<string, unknown>>): AppError | undefined {
    // Check for required fields
    if (!log["message"] || typeof log["message"] !== "string") {
      return makeError(
        "VALIDATION_ERROR",
        "Log entry must have a non-empty message field"
      );
    }

    if (!log["timestamp"] || typeof log["timestamp"] !== "number") {
      return makeError(
        "VALIDATION_ERROR",
        "Log entry must have a numeric timestamp field"
      );
    }

    if (!log["service"] || typeof log["service"] !== "string") {
      return makeError(
        "VALIDATION_ERROR",
        "Log entry must have a non-empty service field"
      );
    }

    if (!log["host"] || typeof log["host"] !== "string") {
      return makeError(
        "VALIDATION_ERROR",
        "Log entry must have a non-empty host field"
      );
    }

    return undefined;
  }

  /**
   * Validate a batch of parsed log entries.
   * Returns valid entries and counts for resilient processing.
   */
  validateBatch(
    entries: ReadonlyArray<{ parsed: Readonly<Record<string, unknown>>; raw: unknown }>
  ): ValidBatchResult {
    const valid: ValidationEntry[] = [];
    let invalidCount = 0;

    entries.forEach((entry, index) => {
      const error = this.validateEntry(entry.parsed);
      if (!error) {
        valid.push({ parsed: entry.parsed, index });
      } else {
        invalidCount++;
      }
    });

    return {
      valid: Object.freeze(valid),
      validCount: valid.length,
      invalidCount,
    };
  }
}
