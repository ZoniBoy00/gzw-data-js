import type { GeneratedDatasetName } from "./generated/datasets.js";

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type GzwRecord = {
  id?: string;
  name?: string;
  image?: string;
  [key: string]: unknown;
};

export type Weapon = GzwRecord & {
  caliber?: string;
  fire_mode?: string;
  fire_rate?: string;
  weight?: string;
};

export type Ammunition = GzwRecord & {
  caliber?: string;
  damage?: string;
  penetration?: string;
  weight?: string;
};

export type ArmorItem = GzwRecord & {
  armor_class?: string;
  protection?: string;
  durability?: string;
  weight?: string;
};

export type Task = GzwRecord & {
  faction?: string;
  objectives?: string;
  rewards?: string;
  level?: string;
};

export type GzwKey = GzwRecord & {
  location?: string;
  used_for?: string;
  type?: string;
};

export type MedicalItem = GzwRecord & {
  effect?: string;
  uses?: string;
  weight?: string;
};

export type Provision = GzwRecord & {
  effect?: string;
  hydration?: string;
  energy?: string;
  weight?: string;
};

export type KnownGzwDataset = GeneratedDatasetName;

/** Known names get autocomplete; new scraper datasets remain valid strings. */
export type GzwDataset = KnownGzwDataset | (string & {});

export type DatasetRecord<Name extends string> =
  Name extends "weapons" ? Weapon :
  Name extends "ammo" | "ammunition" ? Ammunition :
  Name extends "vests" | "helmets" ? ArmorItem :
  Name extends "tasks" | "task" ? Task :
  Name extends "keys" | "keycards" ? GzwKey :
  Name extends "medical" ? MedicalItem :
  Name extends "provisions" ? Provision :
  GzwRecord;

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

export type DatasetBatchOptions = {
  concurrency?: number;
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
  dataVersion?: string | null;
};

export type GzwExportMetadata = {
  dataset: string;
  count: number;
  maxRecords: number;
};

export type DatasetExportResponse<T extends GzwRecord = GzwRecord> = DatasetResponse<T> & {
  export: GzwExportMetadata;
};

export type GzwStats = Record<string, { total: number; sources?: string[] }>;

export type GzwHealth = {
  ok: boolean;
  version?: string;
  implementationVersion?: string;
  datasets: Record<string, number | string>;
  smartRoutes: string[];
  status?: 'ok' | 'degraded';
  ready?: boolean;
  apiVersion?: string;
  datasetCount?: number;
  lastScrapedAt?: string | null;
  dataVersion?: string | null;
};

export type GzwApiRoot = {
  name: string;
  version?: string;
  implementationVersion?: string;
  endpoints: string[];
  docs?: string;
};

export type GzwDatasetMetadata = {
  name: string;
  file?: string;
  itemCount?: number;
  fields?: Record<string, { types?: string[]; presentCount?: number; optional?: boolean; nullable?: boolean; example?: unknown }>;
  [key: string]: unknown;
};

export type GzwVersion = {
  apiVersion: string;
  implementationVersion: string;
  dataVersion?: string | null;
  snapshot?: Record<string, unknown>;
  [key: string]: unknown;
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
  | "DATASET_NOT_FOUND"
  | "RECORD_NOT_FOUND"
  | "ENDPOINT_NOT_FOUND"
  | "INVALID_REQUEST"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR"
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
  cache?: false | { ttlMs?: number; maxEntries?: number };
  onRequest?: (info: GzwRequestInfo) => void;
  onResponse?: (info: GzwResponseInfo) => void;
  onRetry?: (info: GzwRetryInfo) => void;
};
