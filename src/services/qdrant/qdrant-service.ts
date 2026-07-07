/**
 * src/services/qdrant/qdrant-service.ts
 *
 * PURPOSE:
 *   Handles Qdrant search, upsert, and delete operations.
 */

import { qdrantClient } from "./qdrant-client";
import { collectionManager } from "./collection-manager";
import type { Result, AppError } from "../../types/common";
import { ok, err, makeError } from "../../types/common";
import {
  PAYLOAD_SCHEMA_VERSION,
} from "../../constants/qdrant.constants";

export interface QdrantUpsertPoint {
  readonly incidentId: string;
  readonly vector: number[];
  readonly summary: string;
  readonly service: string;
  readonly anomalyTypes: string[];
  readonly severity: string;
  readonly timestamp: number;
  readonly metadata: Record<string, any>;
  readonly tags: string[];
  readonly rootCause?: string;
  readonly remediations?: string[];
}

export interface QdrantSearchResult {
  readonly incidentId: string;
  readonly score: number;
  readonly summary: string;
  readonly rootCause?: string | undefined;
  readonly remediations: string[];
  readonly timestamp: number;
}

export class QdrantService {
  private readonly client = qdrantClient;
  private readonly colManager = collectionManager;

  /**
   * Upserts an incident point to Qdrant. Creates the collection if it is absent.
   */
  async upsert(
    collectionName: string,
    point: QdrantUpsertPoint
  ): Promise<Result<void, AppError>> {
    try {
      const ensureCol = await this.colManager.createCollectionIfAbsent(collectionName);
      if (!ensureCol.success) {
        return ensureCol;
      }

      await this.client.upsert(collectionName, {
        points: [
          {
            id: point.incidentId,
            vector: point.vector,
            payload: {
              incident_id: point.incidentId,
              summary: point.summary,
              service: point.service,
              anomaly_types: point.anomalyTypes,
              severity: point.severity,
              timestamp: point.timestamp,
              metadata: point.metadata,
              tags: point.tags,
              root_cause: point.rootCause || "",
              remediations: point.remediations || [],
              version: PAYLOAD_SCHEMA_VERSION,
            },
          },
        ],
        wait: true,
      });

      return ok(undefined);
    } catch (error: any) {
      return err(
        makeError(
          "QDRANT_OPERATION_FAILED",
          `Failed to upsert point to collection '${collectionName}': ${error.message || String(error)}`,
          {
            cause: error,
            context: { collectionName, pointId: point.incidentId },
          }
        )
      );
    }
  }

  /**
   * Performs vector similarity search.
   */
  async search(
    collectionName: string,
    vector: number[],
    options?: {
      limit?: number;
      threshold?: number;
    }
  ): Promise<Result<QdrantSearchResult[], AppError>> {
    try {
      const response = await this.client.search(collectionName, {
        vector,
        limit: options?.limit ?? 5,
        score_threshold: options?.threshold ?? 0.70,
        with_payload: true,
      });

      const results: QdrantSearchResult[] = response.map((point) => {
        const payload = point.payload || {};
        return {
          incidentId: (payload["incident_id"] || point.id) as string,
          score: point.score,
          summary: (payload["summary"] || "") as string,
          rootCause: (payload["root_cause"] || undefined) as string | undefined,
          remediations: (payload["remediations"] || []) as string[],
          timestamp: (payload["timestamp"] || Date.now()) as number,
        };
      });

      return ok(results);
    } catch (error: any) {
      return err(
        makeError(
          "QDRANT_OPERATION_FAILED",
          `Failed to search collection '${collectionName}': ${error.message || String(error)}`,
          {
            cause: error,
            context: { collectionName, options },
          }
        )
      );
    }
  }

  /**
   * Deletes a point by its incident ID.
   */
  async delete(
    collectionName: string,
    incidentId: string
  ): Promise<Result<void, AppError>> {
    try {
      await this.client.delete(collectionName, {
        points: [incidentId],
      });
      return ok(undefined);
    } catch (error: any) {
      return err(
        makeError(
          "QDRANT_OPERATION_FAILED",
          `Failed to delete point from '${collectionName}': ${error.message || String(error)}`,
          {
            cause: error,
            context: { collectionName, incidentId },
          }
        )
      );
    }
  }
}

export const qdrantService = new QdrantService();
