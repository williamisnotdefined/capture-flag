# Good React SDK Hook

Source: `packages/react/src/index.tsx` (sha256: `8d51b9abf1320a47de62a63b7ecd1e1e851b69c9649cf6418a9353a60ea8ad42`)
Source: `packages/react/test/index.spec.tsx` (sha256: `1f433d8dbecb035a02eda81c2773f51ca184940c7ff3c084cbd13be3290b8c97`)

Why this is canonical:

- Keeps React integration around an injected SDK client.
- Returns fallback on initial render and on SDK failure.
- Returns fallback instead of stale resolved values when hook inputs change.
- Lets hook context override provider context without sending context to the API.

## Hook Pattern

```tsx
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
```

The cancellation guard prevents stale async updates after dependency changes, and the request identity check prevents stale render output before the next effect runs.
