/**
 * src/services/qdrant/qdrant-client.ts
 *
 * PURPOSE:
 *   Initialises and exports the Qdrant REST client singleton.
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../../config/env.ts";

export const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL,
  ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
});
