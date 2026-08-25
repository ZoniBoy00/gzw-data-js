import { GzwApiError, throwIfAborted } from "./errors.js";
import { encodeQuery, isObject } from "./query.js";
import type { GzwDataClient } from "./client.js";
import type { DatasetIteratorOptions, DatasetQuery, DatasetResponse, GzwRecord } from "./types.js";

export class DatasetResource<T extends GzwRecord = GzwRecord> {
  constructor(private readonly client: GzwDataClient, private readonly name: string) {}

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
   * Fetch one record using the API's exact id filter and limit=1 fallback.
   * A dedicated single-record server route can replace this without changing
   * the public SDK method.
   */
  async get(id: string, signal?: AbortSignal): Promise<T | undefined> {
    if (!id.trim()) throw new TypeError("Record id cannot be empty");
    const result = await this.list({ id: id.trim(), limit: 1 }, signal);
    return result.data[0];
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
