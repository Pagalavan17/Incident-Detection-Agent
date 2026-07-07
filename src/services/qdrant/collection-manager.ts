/**
 * src/services/qdrant/collection-manager.ts
 *
 * PURPOSE:
 *   Handles Qdrant collection existence checks and creation.
 */

import { qdrantClient } from "./qdrant-client.ts";
import type { Result, AppError } from "../../types/common.ts";
import { ok, err, makeError } from "../../types/common.ts";
import {
  DEFAULT_VECTOR_SIZE,
  DEFAULT_DISTANCE,
} from "../../constants/qdrant.constants.ts";
import type { QdrantDistance } from "../../constants/qdrant.constants.ts";

export class CollectionManager {
  private readonly client = qdrantClient;

  /**
   * Checks if the collection exists and creates it if not.
   */
  async createCollectionIfAbsent(
    collectionName: string,
    options?: {
      vectorSize?: number;
      distance?: QdrantDistance;
    }
  ): Promise<Result<void, AppError>> {
    try {
      const size = options?.vectorSize ?? DEFAULT_VECTOR_SIZE;
      const distance = options?.distance ?? DEFAULT_DISTANCE;

      const list = await this.client.getCollections();
      const exists = list.collections.some((c) => c.name === collectionName);

      if (!exists) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size,
            distance,
          },
        });
      }
      return ok(undefined);
    } catch (error: any) {
      return err(
        makeError(
          "QDRANT_OPERATION_FAILED",
          `Failed to manage collection '${collectionName}': ${error.message || String(error)}`,
          {
            cause: error,
            context: { collectionName, options },
          }
        )
      );
    }
  }

  /**
   * Deletes a collection if it exists.
   */
  async deleteCollection(collectionName: string): Promise<Result<void, AppError>> {
    try {
      await this.client.deleteCollection(collectionName);
      return ok(undefined);
    } catch (error: any) {
      return err(
        makeError(
          "QDRANT_OPERATION_FAILED",
          `Failed to delete collection '${collectionName}': ${error.message || String(error)}`,
          {
            cause: error,
            context: { collectionName },
          }
        )
      );
    }
  }
}

export const collectionManager = new CollectionManager();
