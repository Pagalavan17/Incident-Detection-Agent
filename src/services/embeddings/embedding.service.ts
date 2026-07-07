/**
 * src/services/embeddings/embedding.service.ts
 *
 * PURPOSE:
 *   Defines the embedding service abstraction and provider implementations.
 *   Provides capability to generate dense vector embeddings for semantic search.
 */

import OpenAI from "openai";
import { env } from "../../config/env.ts";
import type { Result, AppError } from "../../types/common.ts";
import { ok, err, makeError } from "../../types/common.ts";

/**
 * Interface representing a pluggable embedding provider.
 */
export interface EmbeddingProvider {
  /**
   * Generates a single vector embedding for the given text.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generates vector embeddings for a batch of texts.
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Concrete implementation of EmbeddingProvider using OpenAI.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    if (!response.data || response.data.length === 0) {
      throw new Error("OpenAI returned an empty embedding response.");
    }
    const firstData = response.data[0];
    if (!firstData) {
      throw new Error("OpenAI returned an empty data array in embedding response.");
    }
    const vector = firstData.embedding;
    if (!vector) {
      throw new Error("Embedding vector is undefined in OpenAI response.");
    }
    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map((d) => {
      if (!d.embedding) {
        throw new Error("Embedding vector is undefined in batch OpenAI response.");
      }
      return d.embedding;
    });
  }
}

/**
 * Abstraction layer for the embedding service.
 */
export interface IEmbeddingService {
  getEmbedding(text: string): Promise<Result<number[], AppError>>;
  getEmbeddings(texts: string[]): Promise<Result<number[][], AppError>>;
}

/**
 * Concrete implementation of IEmbeddingService.
 */
export class EmbeddingService implements IEmbeddingService {
  private readonly provider: EmbeddingProvider;

  constructor(provider: EmbeddingProvider) {
    this.provider = provider;
  }

  /**
   * Retrieve embedding for a single text input.
   */
  async getEmbedding(text: string): Promise<Result<number[], AppError>> {
    try {
      const vector = await this.provider.embed(text);
      return ok(vector);
    } catch (error: any) {
      return err(
        makeError("EMBEDDING_FAILED", error.message || String(error), {
          cause: error,
          context: { text },
        })
      );
    }
  }

  /**
   * Retrieve embeddings for multiple text inputs.
   */
  async getEmbeddings(texts: string[]): Promise<Result<number[][], AppError>> {
    try {
      const vectors = await this.provider.embedBatch(texts);
      return ok(vectors);
    } catch (error: any) {
      return err(
        makeError("EMBEDDING_FAILED", error.message || String(error), {
          cause: error,
          context: { texts },
        })
      );
    }
  }
}

/**
 * Default instances pre-configured for OpenAI.
 */
export const defaultEmbeddingProvider = new OpenAIEmbeddingProvider(
  env.OPENAI_API_KEY,
  env.OPENAI_EMBEDDING_MODEL
);

export const embeddingService = new EmbeddingService(defaultEmbeddingProvider);
