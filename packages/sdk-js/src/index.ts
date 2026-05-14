import { type CaptureFlagConfig, type EvaluationContext, evaluate } from "@capture-flag/evaluator";

export type { CaptureFlagConfig, EvaluationContext };

export type CaptureFlagClientOptions = {
  sdkKey: string;
  baseUrl: string;
};

export type CaptureFlagClient = {
  getValue<TValue>(
    key: string,
    fallbackValue: TValue,
    context?: EvaluationContext | null,
  ): Promise<TValue>;
};

export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  let cachedConfig: CaptureFlagConfig | null = null;

  async function getConfig(): Promise<CaptureFlagConfig | null> {
    if (cachedConfig) {
      return cachedConfig;
    }

    const response = await fetch(configUrl(options.baseUrl, options.sdkKey));
    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    if (!isCaptureFlagConfig(config)) {
      return null;
    }

    cachedConfig = config;
    return cachedConfig;
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
  };
}

function configUrl(baseUrl: string, sdkKey: string): string {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`public/sdk/${encodeURIComponent(sdkKey)}/config`, normalizedBaseUrl).toString();
}

function isCaptureFlagConfig(value: unknown): value is CaptureFlagConfig {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.projectKey === "string" &&
    typeof value.configKey === "string" &&
    typeof value.environment === "string" &&
    typeof value.revision === "number" &&
    typeof value.generatedAt === "string" &&
    isRecord(value.flags)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
