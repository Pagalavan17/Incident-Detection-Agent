import { run } from "./generate-logs";

try {
  run();
  process.exit(0);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n  ✖  Fatal error during log generation: ${message}`);
  process.exit(1);
}

