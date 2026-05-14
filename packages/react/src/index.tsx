import type { CaptureFlagClient, EvaluationContext } from "@capture-flag/sdk-js";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

type CaptureFlagContextValue = {
  client: CaptureFlagClient;
  context?: EvaluationContext | null;
};

type FeatureFlagState<TValue> = {
  client: CaptureFlagClient;
  context?: EvaluationContext | null;
  fallbackValue: TValue;
  key: string;
  value: TValue;
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

  const client = captureFlag.client;
  const effectiveContext = context === undefined ? captureFlag.context : context;
  const [state, setState] = useState<FeatureFlagState<TValue>>(() => ({
    client,
    context: effectiveContext,
    fallbackValue,
    key,
    value: fallbackValue,
  }));

  useEffect(() => {
    let cancelled = false;
    let requestVersion = 0;
    const requestState = {
      client,
      context: effectiveContext,
      fallbackValue,
      key,
    };

    function requestValue(resetToFallback: boolean) {
      const currentRequestVersion = ++requestVersion;

      if (resetToFallback) {
        setState({ ...requestState, value: fallbackValue });
      }

      client.getValue(key, fallbackValue, effectiveContext).then(
        (nextValue) => {
          if (!cancelled && currentRequestVersion === requestVersion) {
            setState({ ...requestState, value: nextValue });
          }
        },
        () => {
          if (!cancelled && currentRequestVersion === requestVersion) {
            setState({ ...requestState, value: fallbackValue });
          }
        },
      );
    }

    const unsubscribe = client.subscribe(() => requestValue(false));
    requestValue(true);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [client, effectiveContext, fallbackValue, key]);

  const stateMatchesCurrentRequest =
    state.client === client &&
    state.context === effectiveContext &&
    Object.is(state.fallbackValue, fallbackValue) &&
    state.key === key;

  return stateMatchesCurrentRequest ? state.value : fallbackValue;
}
