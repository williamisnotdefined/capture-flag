import type { CaptureFlagClient, EvaluationContext } from "@capture-flag/sdk-js";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

type CaptureFlagContextValue = {
  client: CaptureFlagClient;
  context?: EvaluationContext | null;
};

export type CaptureFlagProviderProps = {
  children: ReactNode;
  client: CaptureFlagClient;
  context?: EvaluationContext | null;
};

const CaptureFlagContext = createContext<CaptureFlagContextValue | null>(null);

export function CaptureFlagProvider({ children, client, context }: CaptureFlagProviderProps) {
  return (
    <CaptureFlagContext.Provider value={{ client, context }}>
      {children}
    </CaptureFlagContext.Provider>
  );
}

export function useFeatureFlag<TValue>(
  key: string,
  fallbackValue: TValue,
  context?: EvaluationContext | null,
): TValue {
  const captureFlag = useContext(CaptureFlagContext);
  if (!captureFlag) {
    throw new Error("useFeatureFlag must be used within CaptureFlagProvider");
  }

  const [value, setValue] = useState<TValue>(fallbackValue);
  const effectiveContext = context === undefined ? captureFlag.context : context;

  useEffect(() => {
    let cancelled = false;

    setValue(fallbackValue);
    captureFlag.client.getValue(key, fallbackValue, effectiveContext).then(
      (nextValue) => {
        if (!cancelled) {
          setValue(nextValue);
        }
      },
      () => {
        if (!cancelled) {
          setValue(fallbackValue);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [captureFlag.client, effectiveContext, fallbackValue, key]);

  return value;
}
