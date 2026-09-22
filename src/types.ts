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
  type?: string;
  armor_class?: string;
  protection?: string;
  durability?: string;
  weight?: string;
  grid_size?: string;
  sold_by?: string;
  material?: string;
  nij_class?: string;
  armor_locations?: string;
  manufacturer?: string;
  category?: string;
};

export type WeaponPart = GzwRecord & {
  type?: string;
  weight?: string;
  sold_by?: string;
  manufacturer?: string;
  accuracy?: string;
  part_category?: string;
};

export type HelmetMod = GzwRecord & {
  type?: string;
  weight?: string;
  sold_by?: string;
  manufacturer?: string;
  mod_type?: string;
  field_of_view?: string;
  phosphor_color?: string;
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
  Name extends "armor" | "vests" | "helmets" ? ArmorItem :
  Name extends "weapon_parts" ? WeaponPart :
  Name extends "helmet_mods" ? HelmetMod :
  Name extends "ammo" | "ammunition" ? Ammunition :
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
  status: "ok" | "degraded";
  apiVersion: string;
  implementationVersion: string;
};

export type GzwApiRoot = {
  name: string;
  version?: string;
  implementationVersion?: string;
  endpoints: string[];
  docs?: string;
  lastScrapedAt?: string | null;
};

export type GzwReadiness = {
  ok: true;
  ready: true;
  status: "ok";
  datasetCount: number;
};

export type GzwSnapshot = {
  snapshotId: string | null;
  version: string | null;
  capturedAt: string | null;
  datasets: Record<string, number>;
};

export type GzwDatasetCountChange = {
  dataset: string;
  before: number;
  after: number;
  delta: number;
};

export type GzwChanges = {
  current: GzwSnapshot;
  latest: GzwSnapshot;
  previous: GzwSnapshot | null;
  historyCount: number;
  hasHistory: boolean;
  changes: {
    datasets: GzwDatasetCountChange[];
    added: string[];
    removed: string[];
  };
  message: string;
};

export type GzwSearchOptions = {
  datasets?: string[];
  fields?: string[];
  fuzzy?: boolean;
  limit?: number;
};

export type GzwFieldMetadata = {
  types?: string[];
  presentCount?: number;
  optional?: boolean;
  nullable?: boolean;
  example?: unknown;
};

export type GzwDatasetCapabilities = {
  operations: string[];
  filters: { supported: boolean; fields: string[] };
  sorting: { supported: boolean; fields: string[]; directions: Array<"asc" | "desc"> };
  counts: { supported: boolean; includesTotal: boolean; includesPageCount: boolean };
};

export type GzwDatasetMetadata = {
  name: string;
  file?: string;
  itemCount?: number;
  fields?: string[] | Record<string, GzwFieldMetadata>;
  capabilities?: GzwDatasetCapabilities;
  lastScrapedAt?: string;
  [key: string]: unknown;
};

export type GzwMetadata = {
  source?: string;
  datasetCount: number;
  datasets: GzwDatasetMetadata[];
  lastScrapedAt?: string;
};

export type GzwDatasetSchema = GzwDatasetMetadata;

export type GzwVersion = {
  api?: string;
  apiVersion: string;
  implementationVersion: string;
  baseUrl?: string;
  openapi?: string;
  dataVersion?: string | null;
  snapshot?: GzwSnapshot;
  historyCount?: number;
  datasetCount?: number;
  datasets?: string[];
  source?: string;
  [key: string]: unknown;
};

export type GzwSearch = {
  query: string;
  results: Record<string, GzwRecord[]>;
  datasets: string[];
  fields: string[];
  fuzzy: boolean;
  limit: number;
};

export type OpenApiSchema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
};

export type OpenApiSpec = {
  openapi: string;
  info: { title: string; version: string; description?: string; [key: string]: unknown };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
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
