import { GzwApiError, throwIfAborted } from "./errors.js";
import { encodeQuery, isObject } from "./query.js";
import type { GzwDataClient } from "./client.js";
import type { DatasetBatchOptions, DatasetExportResponse, DatasetIteratorOptions, DatasetQuery, DatasetResponse, GzwRecord } from "./types.js";

export class DatasetResource<T extends GzwRecord = GzwRecord> {
  constructor(private readonly client: GzwDataClient, private readonly name: string) {}

  info(signal?: AbortSignal): Promise<import("./types.js").GzwDatasetMetadata> {
    return this.client.metadata(this.name, signal) as Promise<import("./types.js").GzwDatasetMetadata>;
  }

  list(options: DatasetQuery = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    const path = `/${encodeURIComponent(this.name)}${encodeQuery(options)}`;
    return this.client.request<unknown>(path, signal).then((payload) => {
      if (Array.isArray(payload)) {
        return { data: payload as T[], count: payload.length };
      }
      if (isObject(payload) && Array.isArray(payload.data)) {
        return payload as unknown as DatasetResponse<T>;
      }
      throw new GzwApiError("GZW Data API returned an invalid dataset response", {
        status: 200,
        code: "INVALID_RESPONSE",
        details: payload,
      });
    });
  }

  /**
   * Fetch one record from the API's dedicated single-record route.
   * A missing record preserves the historical SDK behavior by returning undefined.
   */
  async get(id: string, signal?: AbortSignal): Promise<T | undefined> {
    const normalizedId = id.trim();
    if (!normalizedId) throw new TypeError("Record id cannot be empty");

    try {
      const payload = await this.client.request<unknown>(
        `/${encodeURIComponent(this.name)}/${encodeURIComponent(normalizedId)}`,
        signal,
      );
      if (!isObject(payload)) {
        throw new GzwApiError("GZW Data API returned an invalid record response", {
          status: 200,
          code: "INVALID_RESPONSE",
          details: payload,
        });
      }
      return (isObject(payload.data) ? payload.data : payload) as T;
    } catch (error) {
      if (error instanceof GzwApiError && error.status === 404 && error.code === "RECORD_NOT_FOUND") return undefined;
      throw error;
    }
  }

  async export(options: DatasetQuery = {}, signal?: AbortSignal): Promise<DatasetExportResponse<T>> {
    const path = `/export/${encodeURIComponent(this.name)}${encodeQuery(options)}`;
    const payload = await this.client.request<unknown>(path, signal);
    if (!isObject(payload) || !Array.isArray(payload.data) || !isObject(payload.export)) {
      throw new GzwApiError("GZW Data API returned an invalid export response", {
        status: 200,
        code: "INVALID_RESPONSE",
        details: payload,
      });
    }
    return payload as unknown as DatasetExportResponse<T>;
  }

  async getMany(ids: string[], options: DatasetBatchOptions = {}, signal?: AbortSignal): Promise<Array<T | undefined>> {
    const concurrency = Math.max(1, Math.floor(options.concurrency ?? 4));
    const results: Array<T | undefined> = new Array(ids.length);
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      while (true) {
        throwIfAborted(signal);
        const index = nextIndex;
        nextIndex += 1;
        if (index >= ids.length) return;
        results[index] = await this.get(ids[index], signal);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()));
    return results;
  }

  /**
   * Iterate through paginated dataset results and stop at the known final page
   * or the first incomplete/empty page when the API does not provide totals.
   */
  async *iterate(options: DatasetIteratorOptions = {}, signal?: AbortSignal): AsyncGenerator<T> {
    const { maxPages = 100_000, ...query } = options;
    const perPage = query.perPage ?? 100;
    if (perPage <= 0) throw new RangeError("Iterator perPage must be greater than zero");
    if (maxPages <= 0) throw new RangeError("Iterator maxPages must be greater than zero");

    for (let page = 1; page <= maxPages; page += 1) {
      throwIfAborted(signal);
      const result = await this.list({ ...query, page, perPage }, signal);
      for (const record of result.data) {
        throwIfAborted(signal);
        yield record;
      }
      if (result.data.length === 0) return;
      if (result.totalPages !== undefined && page >= result.totalPages) return;
      if (result.totalPages === undefined && result.data.length < perPage) return;
    }

    throw new RangeError(`Dataset iterator exceeded maxPages (${maxPages})`);
  }

  filter(fields: Record<string, string | number | boolean>, options: DatasetQuery = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    return this.list({ ...options, ...fields }, signal);
  }

  search(query: string, options: Omit<DatasetQuery, "search"> = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    if (!query.trim()) throw new TypeError("Dataset search query cannot be empty");
    return this.list({ ...options, search: query }, signal);
  }
}
