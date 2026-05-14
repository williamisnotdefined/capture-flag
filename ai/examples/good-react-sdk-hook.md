# Good React SDK Hook

Source: `packages/react/src/index.tsx` (sha256: `573755cf26383171eeeb0b49210ea3d2c0beb1170d729e1838a3b250621843c8`)
Source: `packages/react/test/index.spec.tsx` (sha256: `c3c5683bd7f5c00d49f031ac1d41554ac87af9250dd4e8a70981812cdf3215aa`)

Why this is canonical:

- Keeps React integration around an injected SDK client.
- Returns fallback on initial render and on SDK failure.
- Returns fallback instead of stale resolved values when hook inputs change.
- Lets hook context override provider context without sending context to the API.
- Subscribes to SDK config changes and cleans up subscriptions on dependency changes or unmount.

## Hook Pattern

```tsx
const effectiveContext = context === undefined ? captureFlag.context : context;
const client = captureFlag.client;
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
```

The cancellation guard prevents updates after dependency changes or unmount, and the request version prevents older async evaluations from overwriting newer config-change evaluations. The request identity check prevents stale render output before the next effect runs.
