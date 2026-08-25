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

export type DatasetIteratorOptions = Omit<DatasetQuery, "page" | "all" | "perPage"> & {
  perPage?: number;
  maxPages?: number;
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

export type GzwErrorCode =
  | "NETWORK_ERROR"
  | "ABORTED"
  | "HTTP_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "INVALID_RESPONSE"
  | string;

export type GzwRetryInfo = {
  attempt: number;
  delayMs: number;
  url: string;
  status?: number;
  error: Error;
};

export type GzwRequestInfo = {
  attempt: number;
  url: string;
  method: "GET";
};

export type GzwResponseInfo = GzwRequestInfo & {
  status: number;
  ok: boolean;
};

export type GzwDataClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
  onRequest?: (info: GzwRequestInfo) => void;
  onResponse?: (info: GzwResponseInfo) => void;
  onRetry?: (info: GzwRetryInfo) => void;
};
