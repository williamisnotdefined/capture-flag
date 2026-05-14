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

  const effectiveContext = context === undefined ? captureFlag.context : context;
  const [state, setState] = useState<FeatureFlagState<TValue>>(() => ({
    client: captureFlag.client,
    context: effectiveContext,
    fallbackValue,
    key,
    value: fallbackValue,
  }));

  useEffect(() => {
    let cancelled = false;
    const requestState = {
      client: captureFlag.client,
      context: effectiveContext,
      fallbackValue,
      key,
    };

    setState({ ...requestState, value: fallbackValue });
    captureFlag.client.getValue(key, fallbackValue, effectiveContext).then(
      (nextValue) => {
        if (!cancelled) {
          setState({ ...requestState, value: nextValue });
        }
      },
      () => {
        if (!cancelled) {
          setState({ ...requestState, value: fallbackValue });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [captureFlag.client, effectiveContext, fallbackValue, key]);

  const stateMatchesCurrentRequest =
    state.client === captureFlag.client &&
    state.context === effectiveContext &&
    Object.is(state.fallbackValue, fallbackValue) &&
    state.key === key;

  return stateMatchesCurrentRequest ? state.value : fallbackValue;
}
