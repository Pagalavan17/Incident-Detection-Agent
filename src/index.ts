/**
 * src/index.ts — Application Entry Point
 *
 * PURPOSE:
 *   Bootstraps the Incident Response Agent application.
 *   Starts the Express HTTP server (Module 11).
 *
 * EXECUTION:
 *   Development : npm run dev    (tsx watch — hot-reload)
 *   Production  : npm start      (node dist/index.js after npm run build)
 */

import "./config/env"; // validate env vars at startup (fail-fast)
import { startServer } from "./api/server";

// Catch any uncaught promise rejections and exit cleanly
process.on("unhandledRejection", (reason: unknown) => {
  console.error("[process] Unhandled rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("[process] Uncaught exception:", error);
  process.exit(1);
});

import { collectionManager } from "./services/qdrant/collection-manager";
import { QdrantCollections } from "./constants/qdrant.constants";

async function bootstrap() {
  console.log("[bootstrap] Initializing Qdrant collections...");
  for (const collectionName of Object.values(QdrantCollections)) {
    const result = await collectionManager.createCollectionIfAbsent(collectionName);
    if (!result.success) {
      console.error(`[bootstrap] Failed to initialize collection ${collectionName}:`, result.error);
      process.exit(1);
    }
    console.log(`[bootstrap] Verified collection: ${collectionName}`);
  }
  
  startServer();
}

bootstrap();
