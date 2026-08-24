export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type GzwRecord = {
  id?: string;
  name?: string;
  image?: string;
  [key: string]: unknown;
};

export type DatasetQuery = {
  page?: number;
  perPage?: number;
  all?: boolean;
  limit?: number;
  search?: string;
  sort?: string;
  [field: string]: string | number | boolean | undefined;
};

export type DatasetResponse<T extends GzwRecord = GzwRecord> = {
  data: T[];
  count: number;
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  source?: string;
  timestamp?: string;
};

export type GzwStats = Record<string, { total: number; sources?: string[] }>;

export type GzwHealth = {
  ok: boolean;
  version: string;
  datasets: Record<string, number | string>;
  smartRoutes: string[];
};

export type GzwApiRoot = {
  name: string;
  version: string;
  endpoints: string[];
  docs?: string;
};

export type GzwSearch = {
  query: string;
  results: Record<string, GzwRecord[]>;
};

export type OpenApiSpec = Record<string, unknown>;
export type ApiEnvelope<T> = { data: T; [key: string]: unknown };

export type GzwDataClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
};

export class GzwApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly retryAfter?: number;

  constructor(message: string, options: { status: number; code?: string; details?: unknown; retryAfter?: number }) {
    super(message);
    this.name = "GzwApiError";
    this.status = options.status;
    this.code = options.code ?? "HTTP_ERROR";
    this.details = options.details;
    this.retryAfter = options.retryAfter;
  }
}

function encodeQuery(query: DatasetQuery): string {
  const params = new URLSearchParams();
  const entries = Object.entries(query);
  const aliases: Record<string, string> = { perPage: "per_page" };
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    params.set(aliases[key] ?? key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GzwDataClient {
  private readonly baseUrl: string;
  private readonly requestFetch: typeof globalThis.fetch;
  private readonly headers: Record<string, string>;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(options: GzwDataClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://gzw-data.vercel.app/api").replace(/\/+$/, "");
    this.requestFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.headers = { Accept: "application/json", ...options.headers };
    this.retries = Math.max(0, options.retries ?? 2);
    this.retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  }

  dataset<T extends GzwRecord = GzwRecord>(name: string): DatasetResource<T> {
    if (!name.trim()) throw new TypeError("Dataset name cannot be empty");
    return new DatasetResource<T>(this, name.trim());
  }

  async search(query: string, signal?: AbortSignal): Promise<GzwSearch> {
    if (!query.trim()) throw new TypeError("Search query cannot be empty");
    const payload = await this.request<ApiEnvelope<GzwSearch>>(`/search?q=${encodeURIComponent(query)}`, signal);
    return payload.data;
  }

  async stats(signal?: AbortSignal): Promise<GzwStats> {
    const payload = await this.request<ApiEnvelope<GzwStats>>("/stats", signal);
    return payload.data;
  }

  async health(signal?: AbortSignal): Promise<GzwHealth> {
    const payload = await this.request<ApiEnvelope<GzwHealth>>("/health", signal);
    return payload.data;
  }

  async endpoints(signal?: AbortSignal): Promise<GzwApiRoot> {
    const payload = await this.request<ApiEnvelope<GzwApiRoot>>("/", signal);
    return payload.data;
  }

  async spec(signal?: AbortSignal): Promise<OpenApiSpec> {
    return this.request<OpenApiSpec>("/spec", signal);
  }

  async images(signal?: AbortSignal): Promise<Record<string, string>> {
    const payload = await this.request<ApiEnvelope<Record<string, string>>>("/images", signal);
    return payload.data;
  }

  async request<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.requestRaw<T>(path, signal);
  }

  private async requestRaw<T>(path: string, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const response = await this.requestFetch(url, { method: "GET", headers: this.headers, signal });
        const body = await response.json().catch(() => undefined);
        if (response.ok) return body as T;

        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        const retryable = response.status === 429 || response.status >= 500;
        const error = new GzwApiError(
          typeof body?.error === "string" ? body.error : `GZW Data API request failed with HTTP ${response.status}`,
          { status: response.status, details: body, retryAfter: retryAfter || undefined },
        );
        if (!retryable || attempt === this.retries) throw error;
        lastError = error;
        await wait(retryAfter > 0 ? retryAfter * 1000 : this.retryDelayMs * 2 ** attempt);
      } catch (error) {
        if (error instanceof GzwApiError) throw error;
        if (signal?.aborted) throw error;
        lastError = error;
        if (attempt === this.retries) throw error;
        await wait(this.retryDelayMs * 2 ** attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("GZW Data API request failed");
  }
}

export class DatasetResource<T extends GzwRecord = GzwRecord> {
  constructor(private readonly client: GzwDataClient, private readonly name: string) {}

  list(options: DatasetQuery = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    return this.client.request<DatasetResponse<T>>(`/${encodeURIComponent(this.name)}${encodeQuery(options)}`, signal);
  }

  async get(id: string, signal?: AbortSignal): Promise<T | undefined> {
    if (!id.trim()) throw new TypeError("Record id cannot be empty");
    const result = await this.list({ id, limit: 1 }, signal);
    return result.data[0];
  }

  filter(fields: Record<string, string | number | boolean>, options: DatasetQuery = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    return this.list({ ...options, ...fields }, signal);
  }

  search(query: string, options: Omit<DatasetQuery, "search"> = {}, signal?: AbortSignal): Promise<DatasetResponse<T>> {
    return this.list({ ...options, search: query }, signal);
  }
}
