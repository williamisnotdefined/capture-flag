import {
  type CaptureFlagConfig,
  type EvaluationContext,
  type FeatureFlagType,
  evaluate,
  evaluationOperators,
  featureFlagTypes,
} from "@capture-flag/evaluator";

export type { CaptureFlagConfig, EvaluationContext };

export type CaptureFlagClientMode = "auto" | "lazy" | "manual" | "offline";

export type CaptureFlagCacheMode = "memory" | "localStorage";

export type CaptureFlagConfigChangeListener = () => void;

export type CaptureFlagClientOptions = {
  sdkKey: string;
  baseUrl: string;
  mode?: CaptureFlagClientMode;
  cache?: CaptureFlagCacheMode;
  cacheTtlMs?: number;
  pollIntervalMs?: number;
  localStorageKey?: string;
};

export type CaptureFlagClient = {
  getValue<TValue>(
    key: string,
    fallbackValue: TValue,
    context?: EvaluationContext | null,
  ): Promise<TValue>;
  refresh(): Promise<void>;
  close(): void;
  subscribe(listener: CaptureFlagConfigChangeListener): () => void;
};

type CacheEntry = {
  cachedAt: number;
  config: CaptureFlagConfig;
  etag: string | null;
};

type StoredCache = {
  entries: Record<string, CacheEntry>;
  schemaVersion: 3;
};

const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const CACHE_SCHEMA_VERSION = 3;
const PERCENTAGE_BUCKET_SCALE = 10_000;
const PERCENTAGE_UNITS_PER_PERCENT = 100;
const PERCENTAGE_UNIT_TOLERANCE = 1e-9;
const FNV_64_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV_64_ALTERNATE_OFFSET_BASIS = 0x84222325cbf29ce4n;
const FNV_64_PRIME = 0x100000001b3n;
const FNV_64_MASK = 0xffffffffffffffffn;

export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  const mode = options.mode ?? "lazy";
  const cacheTtlMs = positiveNumberOrDefault(options.cacheTtlMs, DEFAULT_CACHE_TTL_MS);
  const pollIntervalMs = positiveNumberOrDefault(options.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS);
  const storage = getStorage(options);
  const cacheScope = createCacheScope(options.baseUrl, options.sdkKey);
  let cacheEntry: CacheEntry | null = readStoredCache(storage, options.localStorageKey, cacheScope);
  let refreshPromise: Promise<void> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<CaptureFlagConfigChangeListener>();

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (mode === "offline" || mode === "manual") {
      return cacheEntry?.config ?? null;
    }

    if (cacheEntry && (mode === "auto" || !isCacheExpired(cacheEntry, cacheTtlMs))) {
      return cacheEntry.config;
    }

    await refreshConfig();
    return cacheEntry?.config ?? null;
  }

  async function refreshConfig(): Promise<void> {
    if (mode === "offline") {
      return;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = fetchAndUpdateCache()
      .catch(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  async function fetchAndUpdateCache(): Promise<void> {
    const response = await fetchConfig(options.baseUrl, options.sdkKey, cacheEntry?.etag ?? null);

    if (response.status === 304) {
      if (cacheEntry) {
        writeCache({ ...cacheEntry, cachedAt: Date.now() });
      }
      return;
    }

    if (!response.ok) {
      return;
    }

    const config = await response.json();
    if (!isCaptureFlagConfig(config)) {
      return;
    }

    replaceCache({
      cachedAt: Date.now(),
      config,
      etag: response.headers.get("etag"),
    });
  }

  function replaceCache(nextEntry: CacheEntry): void {
    const previousEntry = cacheEntry;
    writeCache(nextEntry);

    if (!previousEntry || !cacheEntriesRepresentSameConfig(previousEntry, nextEntry)) {
      notifyConfigChanged();
    }
  }

  function writeCache(nextEntry: CacheEntry): void {
    cacheEntry = nextEntry;
    writeStoredCache(storage, options.localStorageKey, nextEntry, cacheScope);
  }

  function notifyConfigChanged(): void {
    for (const listener of Array.from(listeners)) {
      try {
        listener();
      } catch {
        // Listener failures must not break SDK polling or cache updates.
      }
    }
  }

  if (mode === "auto") {
    pollTimer = setInterval(() => {
      void refreshConfig();
    }, pollIntervalMs);
  }

  return {
    async getValue(key, fallbackValue, context) {
      try {
        return evaluate({
          config: await getConfig(),
          context,
          fallbackValue,
          flagKey: key,
        });
      } catch {
        return fallbackValue;
      }
    },
    async refresh() {
      await refreshConfig();
    },
    close() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      listeners.clear();
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function cacheEntriesRepresentSameConfig(
  previousEntry: CacheEntry,
  nextEntry: CacheEntry,
): boolean {
  if (previousEntry.etag && nextEntry.etag) {
    return previousEntry.etag === nextEntry.etag;
  }

  return cacheConfigIdentity(previousEntry.config) === cacheConfigIdentity(nextEntry.config);
}

function cacheConfigIdentity(config: CaptureFlagConfig): string {
  return `${config.projectKey}:${config.configKey}:${config.environment}:${config.revision}:${config.generatedAt}`;
}

async function fetchConfig(
  baseUrl: string,
  sdkKey: string,
  etag: string | null,
): Promise<Response> {
  const url = configUrl(baseUrl, sdkKey);
  if (!etag) {
    return fetch(url);
  }

  return fetch(url, {
    headers: {
      "If-None-Match": etag,
    },
  });
}

function configUrl(baseUrl: string, sdkKey: string): string {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`public/sdk/${encodeURIComponent(sdkKey)}/config`, normalizedBaseUrl).toString();
}

function createCacheScope(baseUrl: string, sdkKey: string): string {
  return hashCacheScopeCredential(`${normalizeBaseUrl(baseUrl)}:${sdkKey}`);
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  return normalizedBaseUrl ? `${normalizedBaseUrl}/` : "/";
}

function positiveNumberOrDefault(value: number | undefined, fallbackValue: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallbackValue;
}

function isCacheExpired(entry: CacheEntry, cacheTtlMs: number): boolean {
  return Date.now() - entry.cachedAt >= cacheTtlMs;
}

function getStorage(options: CaptureFlagClientOptions): Storage | null {
  if (options.cache !== "localStorage" || !options.localStorageKey) {
    return null;
  }

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readStoredCache(
  storage: Storage | null,
  key: string | undefined,
  cacheScope: string,
): CacheEntry | null {
  if (!storage || !key) {
    return null;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const storedValue = JSON.parse(rawValue);
    if (!isStoredCache(storedValue)) {
      return null;
    }

    const storedEntry = storedValue.entries[cacheScope];
    if (!storedEntry) {
      return null;
    }

    return {
      cachedAt: storedEntry.cachedAt,
      config: storedEntry.config,
      etag: storedEntry.etag,
    };
  } catch {
    return null;
  }
}

function writeStoredCache(
  storage: Storage | null,
  key: string | undefined,
  entry: CacheEntry,
  cacheScope: string,
): void {
  if (!storage || !key) {
    return;
  }

  try {
    const rawValue = storage.getItem(key);
    let storedValue: StoredCache = { entries: {}, schemaVersion: CACHE_SCHEMA_VERSION };
    if (rawValue) {
      try {
        const parsedValue = JSON.parse(rawValue);
        if (isStoredCache(parsedValue)) {
          storedValue = parsedValue;
        }
      } catch {
        storedValue = { entries: {}, schemaVersion: CACHE_SCHEMA_VERSION };
      }
    }
    storedValue.entries[cacheScope] = entry;
    storage.setItem(key, JSON.stringify(storedValue));
  } catch {
    return;
  }
}

function isStoredCache(value: unknown): value is StoredCache {
  return (
    isRecord(value) &&
    value.schemaVersion === CACHE_SCHEMA_VERSION &&
    isRecord(value.entries) &&
    Object.values(value.entries).every(isStoredCacheEntry)
  );
}

function isStoredCacheEntry(value: unknown): value is CacheEntry {
  return (
    isRecord(value) &&
    typeof value.cachedAt === "number" &&
    Number.isFinite(value.cachedAt) &&
    (typeof value.etag === "string" || value.etag === null) &&
    isCaptureFlagConfig(value.config)
  );
}

function isCaptureFlagConfig(value: unknown): value is CaptureFlagConfig {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.projectKey !== "string" ||
    typeof value.configKey !== "string" ||
    typeof value.environment !== "string" ||
    typeof value.revision !== "number" ||
    !Number.isFinite(value.revision) ||
    typeof value.generatedAt !== "string" ||
    !isCaptureFlagConfigSegments(value.segments)
  ) {
    return false;
  }

  const flags = value.flags;
  if (!isRecord(flags)) {
    return false;
  }

  return Object.values(flags).every(isCaptureFlagConfigFlag);
}

function isCaptureFlagConfigSegments(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  return isRecord(value) && Object.values(value).every(isCaptureFlagConfigSegment);
}

function isCaptureFlagConfigSegment(value: unknown): boolean {
  return isRecord(value) && Array.isArray(value.conditions);
}

function isCaptureFlagConfigFlag(value: unknown): value is CaptureFlagConfig["flags"][string] {
  if (!isRecord(value) || !isFeatureFlagType(value.type)) {
    return false;
  }

  const type = value.type;
  return (
    hasOwn(value, "defaultValue") &&
    isValueForFlagType(type, value.defaultValue) &&
    Array.isArray(value.rules) &&
    value.rules.every((rule) => isEvaluationRule(rule, type)) &&
    typeof value.percentageAttribute === "string" &&
    Array.isArray(value.percentageOptions) &&
    isPercentageOptions(value.percentageOptions, type)
  );
}

function isEvaluationRule(value: unknown, type: FeatureFlagType): boolean {
  return (
    isRecord(value) &&
    hasOwn(value, "serve") &&
    isValueForFlagType(type, value.serve) &&
    Array.isArray(value.conditions) &&
    value.conditions.every(isEvaluationCondition)
  );
}

function isEvaluationCondition(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (hasOwn(value, "segment")) {
    return true;
  }

  if (hasOwn(value, "prerequisiteFlag")) {
    return (
      Object.keys(value).length === 3 &&
      typeof value.prerequisiteFlag === "string" &&
      value.prerequisiteFlag.trim() !== "" &&
      typeof value.operator === "string" &&
      hasOwn(value, "value")
    );
  }

  return isAttributeEvaluationCondition(value);
}

function isAttributeEvaluationCondition(value: unknown): boolean {
  return (
    isRecord(value) &&
    !hasOwn(value, "segment") &&
    !hasOwn(value, "prerequisiteFlag") &&
    typeof value.attribute === "string" &&
    value.attribute.trim() !== "" &&
    typeof value.operator === "string" &&
    evaluationOperators.includes(value.operator as (typeof evaluationOperators)[number]) &&
    hasOwn(value, "value")
  );
}

function isPercentageOptions(value: unknown[], type: FeatureFlagType): boolean {
  if (value.length === 0) {
    return true;
  }

  let totalPercentageUnits = 0;
  for (const option of value) {
    const percentageUnits = isRecord(option) ? percentageToBucketUnits(option.percentage) : null;
    if (
      !isRecord(option) ||
      !hasOwn(option, "value") ||
      typeof option.percentage !== "number" ||
      !Number.isFinite(option.percentage) ||
      option.percentage < 0 ||
      option.percentage > 100 ||
      percentageUnits === null ||
      !isValueForFlagType(type, option.value)
    ) {
      return false;
    }

    totalPercentageUnits += percentageUnits;
    if (totalPercentageUnits > PERCENTAGE_BUCKET_SCALE) {
      return false;
    }
  }

  return totalPercentageUnits === PERCENTAGE_BUCKET_SCALE;
}

function percentageToBucketUnits(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const scaledPercentage = value * PERCENTAGE_UNITS_PER_PERCENT;
  const percentageUnits = Math.round(scaledPercentage);

  if (
    !Number.isSafeInteger(percentageUnits) ||
    Math.abs(scaledPercentage - percentageUnits) > PERCENTAGE_UNIT_TOLERANCE
  ) {
    return null;
  }

  return percentageUnits;
}

function isFeatureFlagType(value: unknown): value is FeatureFlagType {
  return typeof value === "string" && featureFlagTypes.includes(value as FeatureFlagType);
}

function isValueForFlagType(type: FeatureFlagType, value: unknown): boolean {
  if (type === "boolean") {
    return typeof value === "boolean";
  }

  if (type === "string") {
    return typeof value === "string";
  }

  if (type === "integer") {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }

  if (type === "json_object") {
    return isJsonObjectValue(value);
  }

  if (type === "json_array") {
    return isJsonArrayValue(value);
  }

  return typeof value === "number" && Number.isFinite(value);
}

function isJsonObjectValue(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function isJsonArrayValue(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.every(isJsonValue);
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return isJsonObjectValue(value) || isJsonArrayValue(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hashCacheScopeCredential(value: string): string {
  return `${hashString64(value, FNV_64_OFFSET_BASIS)}${hashString64(
    value,
    FNV_64_ALTERNATE_OFFSET_BASIS,
  )}`;
}

function hashString64(value: string, offsetBasis: bigint): string {
  let hash = offsetBasis;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = (hash * FNV_64_PRIME) & FNV_64_MASK;
  }

  return hash.toString(16).padStart(16, "0");
}
