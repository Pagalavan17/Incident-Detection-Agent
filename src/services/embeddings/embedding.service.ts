/**
 * src/services/embeddings/embedding.service.ts
 *
 * PURPOSE:
 *   Defines the embedding service abstraction and provider implementations.
 *   Provides capability to generate dense vector embeddings for semantic search.
 */

import OpenAI from "openai";
import { env, requireProviderKey } from "../../config/env";
import type { Result, AppError } from "../../types/common";
import { ok, err, makeError } from "../../types/common";

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
   *
   * Returns Err(AppError) with code ENV_VALIDATION_FAILED if OPENAI_API_KEY
   * is not configured, or EMBEDDING_FAILED if the API call itself fails.
   */
  async getEmbedding(text: string): Promise<Result<number[], AppError>> {
    try {
      const vector = await this.provider.embed(text);
      return ok(vector);
    } catch (error: unknown) {
      const isAppErrorShape =
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        "message" in error;
      if (isAppErrorShape) {
        // Re-wrap AppError-shaped throws from requireProviderKey.
        return err(error as AppError);
      }
      const msg = error instanceof Error ? error.message : String(error);
      return err(
        makeError("EMBEDDING_FAILED", msg, { context: { text } })
      );
    }
  }

  /**
   * Retrieve embeddings for multiple text inputs.
   *
   * Returns Err(AppError) with code ENV_VALIDATION_FAILED if OPENAI_API_KEY
   * is not configured, or EMBEDDING_FAILED if the API call itself fails.
   */
  async getEmbeddings(texts: string[]): Promise<Result<number[][], AppError>> {
    try {
      const vectors = await this.provider.embedBatch(texts);
      return ok(vectors);
    } catch (error: unknown) {
      const isAppErrorShape =
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        "message" in error;
      if (isAppErrorShape) {
        return err(error as AppError);
      }
      const msg = error instanceof Error ? error.message : String(error);
      return err(
        makeError("EMBEDDING_FAILED", msg, { context: { texts } })
      );
    }
  }
}

/**
 * Lazy singleton for the default OpenAI embedding provider.
 *
 * The provider is NOT created at module load time. It is created on first
 * use inside a closure so that a missing OPENAI_API_KEY at startup does not
 * crash the process. requireProviderKey() inside OpenAIEmbeddingProvider's
 * lazy factory throws an AppError-shaped object that EmbeddingService catches
 * and converts to Err(AppError).
 */
class LazyOpenAIEmbeddingProvider implements EmbeddingProvider {
  private inner: OpenAIEmbeddingProvider | undefined;

  private resolve(): OpenAIEmbeddingProvider {
    if (this.inner !== undefined) return this.inner;
    // Throws AppError-shaped object if OPENAI_API_KEY is absent.
    const apiKey = requireProviderKey("OPENAI_API_KEY", "OpenAI Embeddings");
    this.inner = new OpenAIEmbeddingProvider(apiKey, env.OPENAI_EMBEDDING_MODEL);
    return this.inner;
  }

  async embed(text: string): Promise<number[]> {
    return this.resolve().embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.resolve().embedBatch(texts);
  }
}

export const defaultEmbeddingProvider = new LazyOpenAIEmbeddingProvider();
export const embeddingService = new EmbeddingService(defaultEmbeddingProvider);
