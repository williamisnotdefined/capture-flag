export type CaptureFlagClientOptions = {
  sdkKey: string;
  baseUrl: string;
};

export type CaptureFlagClient = {
  getValue<TValue>(key: string, fallbackValue: TValue): Promise<TValue>;
};

export function createClient(options: CaptureFlagClientOptions): CaptureFlagClient {
  return {
    async getValue(_key, fallbackValue) {
      void options;
      return fallbackValue;
    },
  };
}
