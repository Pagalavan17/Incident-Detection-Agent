/**
 * src/scripts/generate-logs.ts
 *
 * PURPOSE:
 *   Entry-point script for the synthetic log generation pipeline.
 *   Orchestrates the full synthetic log generation pipeline:
 *     1. Generate ~500 synthetic log entries via SyntheticLogGenerator.
 *     2. Parse each entry using LogParser.
 *     3. Validate parsed records using LogValidator.
 *     4. Normalise validated records using LogNormaliser.
 *     5. Write the raw synthetic entries to data/synthetic-logs.json.
 *     6. Print a summary report to stdout.
 *
 * OUTPUT:
 *   • data/synthetic-logs.json — array of SyntheticLogEntry objects.
 *   • Console summary — total generated, distribution by service and severity.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SyntheticLogGenerator,
  DEFAULT_GENERATOR_OPTIONS,
} from "../services/logs/synthetic.generator.ts";
import { LogParser } from "../services/logs/parser.ts";
import { LogValidator } from "../services/logs/validator.ts";
import { LogNormaliser } from "../services/logs/normalizer.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data", "synthetic-logs.json");

const LOG_COUNT = 500 as const;
const ANOMALY_FRACTION = 0.15 as const;
const SEPARATOR = "─".repeat(60);

const pad = (str: string, width: number): string => str.padEnd(width, " ");
const padNum = (n: number, width: number): string => String(n).padStart(width, " ");

const printDistributionTable = (
  title: string,
  distribution: Readonly<Record<string, number>>,
  total: number
): void => {
  console.log(`\n  ${title}`);
  console.log(`  ${"─".repeat(45)}`);

  const sorted = Object.entries(distribution).sort(([, a], [, b]) => b - a);

  for (const [label, count] of sorted) {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
    const bar = "█".repeat(Math.round((count / total) * 20));
    console.log(
      `  ${pad(label, 26)} ${padNum(count, 5)}  (${pad(pct + "%", 6)})  ${bar}`
    );
  }
};

export const run = (): void => {
  console.log();
  console.log(SEPARATOR);
  console.log("  Incident Agent — Synthetic Log Generator");
  console.log(SEPARATOR);
  console.log(`  Target count   : ${LOG_COUNT} entries`);
  console.log(`  Anomaly rate   : ${(ANOMALY_FRACTION * 100).toFixed(0)}%`);
  console.log(
    `  Window         : ${DEFAULT_GENERATOR_OPTIONS.windowMs / 60_000} minutes`
  );
  console.log(`  Output path    : ${OUTPUT_PATH}`);
  console.log(SEPARATOR);

  console.log("\n  [1/4] Generating synthetic log entries...");
  const generator = new SyntheticLogGenerator();
  const synthetic = generator.generate({
    count: LOG_COUNT,
    anomalyFraction: ANOMALY_FRACTION,
  });
  const summary = generator.summarise(synthetic);
  console.log(`       Generated ${summary.total} entries (${summary.anomalyCount} anomalies)`);

  console.log("\n  [2/4] Parsing entries...");
  const parser = new LogParser();
  const parseResult = parser.parseBatch(synthetic);
  console.log(
    `       Parsed: ${parseResult.successCount} ok, ${parseResult.failureCount} failed`
  );

  if (parseResult.failureCount > 0) {
    console.warn(`\n  ⚠  Parse failures (first 3):`);
    parseResult.failures.slice(0, 3).forEach((f) => {
      console.warn(`     [index ${f.index}] ${f.reason}`);
    });
  }

  console.log("\n  [3/4] Validating parsed records...");
  const validator = new LogValidator();
  const validationResult = validator.validateBatch(parseResult.successes);
  console.log(
    `       Valid: ${validationResult.validCount}, Invalid: ${validationResult.invalidCount}`
  );

  if (validationResult.invalidCount > 0) {
    console.warn(`\n  ⚠  Validation failures (first 3):`);
    validationResult.invalid.slice(0, 3).forEach((f) => {
      const issues = f.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      console.warn(`     [index ${f.index}] ${issues}`);
    });
  }

  console.log("\n  [4/4] Normalising validated records...");
  const normaliser = new LogNormaliser();
  const normalisationResult = normaliser.normaliseBatch(validationResult.valid);
  console.log(`       Normalised: ${normalisationResult.total} entries`);

  const dataDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(synthetic, null, 2), "utf-8");
  console.log(`\n  ✔  Written to: ${OUTPUT_PATH}`);

  console.log(`\n${SEPARATOR}`);
  console.log("  GENERATION SUMMARY");
  console.log(SEPARATOR);
  console.log(`  Total generated  : ${summary.total}`);
  console.log(`  Anomaly entries  : ${summary.anomalyCount}`);
  console.log(`  Parse successes  : ${parseResult.successCount}`);
  console.log(`  Validation valid : ${validationResult.validCount}`);
  console.log(`  Normalised       : ${normalisationResult.total}`);

  printDistributionTable("Distribution by Service", summary.byService, summary.total);
  printDistributionTable("Distribution by Severity", summary.bySeverity, summary.total);

  console.log(`\n${SEPARATOR}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    run();
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n  ✖  Fatal error during log generation: ${message}`);
    if (err instanceof Error && err.stack !== undefined) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
