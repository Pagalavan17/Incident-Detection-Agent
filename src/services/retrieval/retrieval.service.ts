/**
 * src/services/retrieval/retrieval.service.ts
 *
 * PURPOSE:
 *   Handles semantic similarity retrieval of historical incidents.
 *   Uses constructor injection to remain provider-agnostic.
 */

import type { IEmbeddingService } from "../embeddings/embedding.service.ts";
import type { IncidentContext } from "../../models/IncidentContext.ts";
import type { SimilarIncident } from "../../contracts/incident.contract.ts";
import type {
  Result,
  AppError,
  IncidentId,
  ISODateString,
} from "../../types/common.ts";
import {
  ok,
  err,
  makeError,
  toIncidentId,
  toISODateString,
  epochMsToDate,
  nowEpochMs,
} from "../../types/common.ts";
import { PRIMARY_COLLECTION_NAME } from "../../constants/qdrant.constants.ts";
import { embeddingService } from "../embeddings/embedding.service.ts";
import { qdrantService } from "../qdrant/qdrant-service.ts";
import type { QdrantService, QdrantSearchResult } from "../qdrant/qdrant-service.ts";

/**
 * The standard retrieval response output format.
 */
export interface RetrievalResult {
  readonly queryIncidentId: IncidentId;
  readonly matches: ReadonlyArray<SimilarIncident>;
  readonly searchedAt: ISODateString;
}

export class RetrievalService {
  /**
   * Constructs the retrieval service using constructor injection.
   * Decoupled from concrete embedding providers.
   */
  constructor(
    private readonly embeddingService: IEmbeddingService,
    private readonly qdrantService: QdrantService
  ) {}

  /**
   * Retrieves top-K semantically similar incidents for a given context.
   */
  async retrieveSimilarIncidents(
    context: IncidentContext,
    options?: {
      limit?: number;
      threshold?: number;
      collectionName?: string;
    }
  ): Promise<Result<RetrievalResult, AppError>> {
    const queryText = context.title || context.signal.description;
    const collectionName = options?.collectionName ?? PRIMARY_COLLECTION_NAME;

    // 1. Generate embedding
    const embedResult = await this.embeddingService.getEmbedding(queryText);
    if (!embedResult.success) {
      return err(
        makeError(
          "RETRIEVAL_FAILED",
          "Failed to generate embedding for the incident query text",
          { cause: embedResult.error }
        )
      );
    }

    const searchOpts: { limit?: number; threshold?: number } = {};
    if (options?.limit !== undefined) {
      searchOpts.limit = options.limit;
    }
    if (options?.threshold !== undefined) {
      searchOpts.threshold = options.threshold;
    }

    const searchResult = await this.qdrantService.search(
      collectionName,
      embedResult.data,
      searchOpts
    );

    if (!searchResult.success) {
      return err(
        makeError(
          "RETRIEVAL_FAILED",
          "Failed to retrieve similar incidents from vector store",
          { cause: searchResult.error }
        )
      );
    }

    // 3. Map search results to SimilarIncident array
    const matches: SimilarIncident[] = searchResult.data.map((r: QdrantSearchResult) => ({
      incidentId: toIncidentId(r.incidentId),
      similarity: r.score,
      summary: r.summary,
      rootCause: r.rootCause,
      remediations: r.remediations,
      occurredAt: toISODateString(epochMsToDate(r.timestamp as any)),
    }));

    return ok({
      queryIncidentId: context.id,
      matches,
      searchedAt: toISODateString(epochMsToDate(nowEpochMs())),
    });
  }
}

/**
 * Export default pre-configured retrieval service instance.
 */
export const retrievalService = new RetrievalService(embeddingService, qdrantService);
