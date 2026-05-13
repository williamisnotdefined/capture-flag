# Client State Management

Use this skill when adding or changing client-side state, React Query data flow, immutable context values, or Zustand stores in `apps/client`.

## Rules

- Use React Query as the source of truth for server state: authenticated user, organizations, projects, configs, environments, SDK keys, members, feature flags, and mutation freshness.
- Mutation hooks own cache invalidation with `queryClient.invalidateQueries`; components should not manually patch copied server arrays unless optimistic UI is explicitly required.
- Use local component state for short-lived UI state owned by one component, such as focused item, open panel, copy message, form-only error, or transient draft values.
- Lift client state only to the nearest common owner that explicitly consumes it. Prefer small hooks per state concern over a provider that centralizes unrelated state.
- Use React Router params/search params for state that must be linkable, reload-safe, or part of navigation behavior.
- Use Zustand only for client-side state shared across unrelated branches or routes when React Query, router state, local state, or focused hooks are not enough.
- Do not use React Context for mutable state. Context is allowed only for stable constants or services that do not change during the app lifetime, so it does not rerender an entire subtree for state updates.
- Do not copy React Query data into Zustand or local state just to pass it to children. Pass IDs, derive selected entities from query data, or let the child call the appropriate query hook.
- Keep selection state as IDs, not duplicated entity objects. Reconcile selected IDs against current query data in a colocated hook.
- Keep state reset rules near the state owner. Changing organization should reset project/config/environment selections; changing project should reset config/environment selections and dependent one-time UI.
- Extract reusable stateful behavior into custom hooks, such as clipboard copy messages, selection reconciliation, debounced input, and persisted UI preferences.
- Do not fix a god component by moving all state and effects into a god provider or god hook. Split ownership by explicit consumers; use Zustand only when state is truly global or cross-route.

## Ownership Order

- Server/cache state: React Query hooks under `src/api/<domain>`.
- Route/navigation state: React Router params, loaders, or search params.
- Page workflow state shared by sibling panels: nearest common page component plus focused page-specific hooks.
- Component-only state: local `useState` or React Hook Form state in the owning component.
- Cross-route client state with no server backing: Zustand store under a feature-specific path.
- Stable app constants or immutable services: React Context, only when prop passing would be noisy and the context value does not change.

## Zustand Guidance

- Add `zustand` only when there is a concrete truly global, cross-feature, or cross-route client-state need.
- Keep stores small and domain-specific; avoid a single global app store.
- Store primitive state, IDs, and actions. Avoid storing server response objects already owned by React Query.
- Do not use Zustand as an event bus for mutation results. Prefer mutation callbacks, invalidation, and derived query state.

## Verification

- Search changed components for copied query data in `useState` or Zustand before finishing.
- Search changed components for direct query-key imports; invalidation belongs in API mutation hooks.
- Run `npm --workspace @capture-flag/client run build` after state-management refactors.
