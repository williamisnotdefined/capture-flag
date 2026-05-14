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
};

type CacheEntry = {
  cachedAt: number;
  config: CaptureFlagConfig;
  etag: string | null;
};

type StoredCacheEntry = CacheEntry & {
  schemaVersion: 1;
};

const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const CACHE_SCHEMA_VERSION = 1;

export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  const mode = options.mode ?? "lazy";
  const cacheTtlMs = positiveNumberOrDefault(options.cacheTtlMs, DEFAULT_CACHE_TTL_MS);
  const pollIntervalMs = positiveNumberOrDefault(options.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS);
  const storage = getStorage(options);
  let cacheEntry: CacheEntry | null = readStoredCache(storage, options.localStorageKey);
  let refreshPromise: Promise<void> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

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

    writeCache({
      cachedAt: Date.now(),
      config,
      etag: response.headers.get("etag"),
    });
  }

  function writeCache(nextEntry: CacheEntry): void {
    cacheEntry = nextEntry;
    writeStoredCache(storage, options.localStorageKey, nextEntry);
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
    },
  };
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

function readStoredCache(storage: Storage | null, key: string | undefined): CacheEntry | null {
  if (!storage || !key) {
    return null;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const storedValue = JSON.parse(rawValue);
    if (!isStoredCacheEntry(storedValue)) {
      return null;
    }

    return {
      cachedAt: storedValue.cachedAt,
      config: storedValue.config,
      etag: storedValue.etag,
    };
  } catch {
    return null;
  }
}

function writeStoredCache(
  storage: Storage | null,
  key: string | undefined,
  entry: CacheEntry,
): void {
  if (!storage || !key) {
    return;
  }

  try {
    const storedValue: StoredCacheEntry = {
      ...entry,
      schemaVersion: CACHE_SCHEMA_VERSION,
    };
    storage.setItem(key, JSON.stringify(storedValue));
  } catch {
    return;
  }
}

function isStoredCacheEntry(value: unknown): value is StoredCacheEntry {
  return (
    isRecord(value) &&
    value.schemaVersion === CACHE_SCHEMA_VERSION &&
    typeof value.cachedAt === "number" &&
    Number.isFinite(value.cachedAt) &&
    (typeof value.etag === "string" || value.etag === null) &&
    isCaptureFlagConfig(value.config)
  );
}

function isCaptureFlagConfig(value: unknown): value is CaptureFlagConfig {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.projectKey === "string" &&
    typeof value.configKey === "string" &&
    typeof value.environment === "string" &&
    typeof value.revision === "number" &&
    Number.isFinite(value.revision) &&
    typeof value.generatedAt === "string" &&
    isRecord(value.flags) &&
    Object.values(value.flags).every((flag) => isCaptureFlagConfigFlag(flag))
  );
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
    return typeof value.segment === "string";
  }

  return isAttributeEvaluationCondition(value);
}

function isAttributeEvaluationCondition(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.attribute === "string" &&
    typeof value.operator === "string" &&
    evaluationOperators.includes(value.operator as (typeof evaluationOperators)[number]) &&
    hasOwn(value, "value")
  );
}

function isPercentageOptions(value: unknown[], type: FeatureFlagType): boolean {
  if (value.length === 0) {
    return true;
  }

  let totalPercentage = 0;
  for (const option of value) {
    if (
      !isRecord(option) ||
      !hasOwn(option, "value") ||
      typeof option.percentage !== "number" ||
      !Number.isFinite(option.percentage) ||
      option.percentage < 0 ||
      option.percentage > 100 ||
      !isValueForFlagType(type, option.value)
    ) {
      return false;
    }

    totalPercentage += option.percentage;
    if (totalPercentage - 100 > Number.EPSILON) {
      return false;
    }
  }

  return Math.abs(totalPercentage - 100) <= Number.EPSILON;
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

  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
