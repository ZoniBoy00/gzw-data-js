import { GzwApiError, abortError, throwIfAborted } from "./errors.js";
import { isObject, parseRetryAfter, wait } from "./query.js";
import type { DatasetRecord, GzwApiRoot, GzwDataClientOptions, GzwDataset, GzwDatasetMetadata, GzwHealth, GzwRequestInfo, GzwResponseInfo, GzwRetryInfo, GzwSearch, GzwStats, GzwVersion, OpenApiSpec } from "./types.js";
import { DatasetResource } from "./dataset.js";

export class GzwDataClient {
  private readonly baseUrl: string;
  private readonly requestFetch: typeof globalThis.fetch;
  private readonly headers: Record<string, string>;
  private readonly retries: number;
  private readonly retryDelayMs: number;
  private readonly maxRetryDelayMs: number;
  private readonly cacheTtlMs: number;
  private readonly cacheMaxEntries: number;
  private readonly responseCache = new Map<string, { expiresAt: number; value: unknown }>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly onRequest?: (info: GzwRequestInfo) => void;
  private readonly onResponse?: (info: GzwResponseInfo) => void;
  private readonly onRetry?: (info: GzwRetryInfo) => void;

  constructor(options: GzwDataClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://gzw-data.dev/api/v1").replace(/\/+$/, "");
    this.requestFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.headers = { Accept: "application/json", ...options.headers };
    this.retries = Math.max(0, options.retries ?? 2);
    this.retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
    this.maxRetryDelayMs = Math.max(this.retryDelayMs, options.maxRetryDelayMs ?? 30_000);
    const cacheOptions = options.cache === false ? {} : options.cache ?? {};
    this.cacheTtlMs = Math.max(0, cacheOptions.ttlMs ?? 0);
    this.cacheMaxEntries = Math.max(1, Math.floor(cacheOptions.maxEntries ?? 100));
    this.onRequest = options.onRequest;
    this.onResponse = options.onResponse;
    this.onRetry = options.onRetry;
  }

  dataset<Name extends GzwDataset>(name: Name): DatasetResource<DatasetRecord<Name>>;
  dataset<T extends import("./types.js").GzwRecord>(name: string): DatasetResource<T>;
  dataset(name: string): DatasetResource<import("./types.js").GzwRecord> {
    if (!name.trim()) throw new TypeError("Dataset name cannot be empty");
    return new DatasetResource(this, name.trim());
  }

  async search(query: string, signal?: AbortSignal): Promise<GzwSearch> {
    if (!query.trim()) throw new TypeError("Search query cannot be empty");
    return this.requestEnvelope<GzwSearch>(`/search?q=${encodeURIComponent(query)}`, signal);
  }

  async stats(signal?: AbortSignal): Promise<GzwStats> {
    return this.requestEnvelope<GzwStats>("/stats", signal);
  }

  async health(signal?: AbortSignal): Promise<GzwHealth> {
    return this.requestEnvelope<GzwHealth>("/health", signal);
  }

  async endpoints(signal?: AbortSignal): Promise<GzwApiRoot> {
    return this.requestEnvelope<GzwApiRoot>("/", signal);
  }

  async spec(signal?: AbortSignal): Promise<OpenApiSpec> {
    return this.request<OpenApiSpec>("/spec", signal);
  }

  async images(signal?: AbortSignal): Promise<Record<string, string>> {
    return this.requestEnvelope<Record<string, string>>("/images", signal);
  }

  async metadata(dataset?: string, signal?: AbortSignal): Promise<GzwDatasetMetadata | GzwDatasetMetadata[]> {
    const path = dataset ? `/metadata/${encodeURIComponent(dataset)}` : "/metadata?full=true";
    return this.requestEnvelope<GzwDatasetMetadata | GzwDatasetMetadata[]>(path, signal);
  }

  async version(signal?: AbortSignal): Promise<GzwVersion> {
    return this.requestEnvelope<GzwVersion>("/version", signal);
  }

  async armor(signal?: AbortSignal) {
    return this.dataset<import("./types.js").ArmorItem>("armor").list({}, signal);
  }

  async weaponParts(signal?: AbortSignal) {
    return this.dataset("weapon_parts").list({}, signal);
  }

  async helmetMods(signal?: AbortSignal) {
    return this.dataset("helmet_mods").list({}, signal);
  }

  async requestEnvelope<T>(path: string, signal?: AbortSignal): Promise<T> {
    const payload = await this.request<unknown>(path, signal);
    if (!isObject(payload) || !("data" in payload)) {
      throw new GzwApiError("GZW Data API returned an invalid data envelope", {
        status: 200,
        code: "INVALID_RESPONSE",
        requestUrl: `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
        details: payload,
      });
    }
    return payload.data as T;
  }

  clearCache(path?: string): void {
    if (path === undefined) {
      this.responseCache.clear();
      return;
    }
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    this.responseCache.delete(url);
  }

  async request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const cached = this.responseCache.get(url);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        this.responseCache.delete(url);
        this.responseCache.set(url, cached);
        return cached.value as T;
      }
      this.responseCache.delete(url);
    }

    const existing = this.inFlight.get(url);
    if (existing) return existing as Promise<T>;

    const pending = this.requestNetwork<T>(path, signal).then((value) => {
      if (this.cacheTtlMs > 0) {
        this.responseCache.set(url, { expiresAt: Date.now() + this.cacheTtlMs, value });
        while (this.responseCache.size > this.cacheMaxEntries) {
          this.responseCache.delete(this.responseCache.keys().next().value as string);
        }
      }
      return value;
    });
    this.inFlight.set(url, pending);
    try {
      return await pending;
    } finally {
      if (this.inFlight.get(url) === pending) this.inFlight.delete(url);
    }
  }

  private async requestNetwork<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      throwIfAborted(signal);
      this.onRequest?.({ attempt: attempt + 1, url, method: "GET" });
      try {
        const response = await this.requestFetch(url, { method: "GET", headers: this.headers, signal });
        this.onResponse?.({ attempt: attempt + 1, url, method: "GET", status: response.status, ok: response.ok });
        const body = await this.parseBody(response, url, signal);

        if (response.ok) {
          if (!isObject(body) && !Array.isArray(body)) {
            const error = new GzwApiError("GZW Data API returned an invalid response body", {
              status: response.status,
              statusText: response.statusText,
              requestUrl: url,
              code: "INVALID_RESPONSE",
              details: body,
            });
            if (attempt === this.retries) throw error;
            await this.retry(error, attempt, url, signal);
            continue;
          }
          return body as T;
        }

        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        const errorObject = isObject(body) && isObject(body.error) ? body.error : undefined;
        const code = typeof errorObject?.code === "string"
          ? errorObject.code
          : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "SERVER_ERROR" : "HTTP_ERROR";
        const message = typeof errorObject?.message === "string"
          ? errorObject.message
          : isObject(body) && typeof body.error === "string" ? body.error : `GZW Data API request failed with HTTP ${response.status}`;
        const error = new GzwApiError(message, {
          status: response.status,
          statusText: response.statusText,
          requestUrl: url,
          code,
          details: body,
          retryAfter,
        });
        if (!this.isRetryable(error) || attempt === this.retries) throw error;
        await this.retry(error, attempt, url, signal, retryAfter);
      } catch (error) {
        if (error instanceof GzwApiError) {
          if (error.code === "ABORTED" || !this.isRetryable(error) || attempt === this.retries) throw error;
          lastError = error;
          await this.retry(error, attempt, url, signal, error.retryAfter);
          continue;
        }
        if (signal?.aborted) throw abortError(signal);
        const networkError = new GzwApiError("GZW Data API network request failed", {
          status: 0,
          code: "NETWORK_ERROR",
          requestUrl: url,
          cause: error,
        });
        if (attempt === this.retries) throw networkError;
        await this.retry(networkError, attempt, url, signal);
      }
    }

    throw lastError ?? new GzwApiError("GZW Data API request failed", { status: 0, code: "NETWORK_ERROR", requestUrl: url });
  }

  private async parseBody(response: Response, url: string, signal?: AbortSignal): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      const invalidResponse = new GzwApiError("GZW Data API returned invalid JSON", {
        status: response.status,
        statusText: response.statusText,
        requestUrl: url,
        code: "INVALID_RESPONSE",
        cause: error,
      });
      throwIfAborted(signal);
      throw invalidResponse;
    }
  }

  private isRetryable(error: GzwApiError): boolean {
    return error.code === "RATE_LIMITED" || error.code === "SERVER_ERROR" || error.code === "INVALID_RESPONSE" || error.code === "NETWORK_ERROR";
  }

  private async retry(error: GzwApiError, attempt: number, url: string, signal?: AbortSignal, retryAfter?: number): Promise<void> {
    const exponentialDelay = this.retryDelayMs * 2 ** attempt;
    const requestedDelay = retryAfter === undefined ? exponentialDelay : retryAfter * 1000;
    const delayMs = Math.min(this.maxRetryDelayMs, Math.max(0, requestedDelay));
    this.onRetry?.({ attempt: attempt + 1, delayMs, url, status: error.status || undefined, error });
    await wait(delayMs, signal);
  }
}
