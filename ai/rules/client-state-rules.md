# Client State Rules

Rules for state ownership in `apps/client`.

## Always

- Use React Query as the source of truth for server state.
- Let mutation hooks own cache invalidation with `queryClient.invalidateQueries`.
- Use local component state for short-lived UI state owned by one component.
- Lift state only to the nearest common owner that explicitly consumes it.
- Use React Router params or search params for linkable, reload-safe, navigation state.
- Keep selection state as IDs, not duplicated entity objects.
- Reconcile selected IDs against current query data in a colocated hook.
- Keep state reset rules near the state owner.

## Never

- Do not manually patch copied server arrays in components unless optimistic UI is explicitly required.
- Do not copy React Query data into Zustand or local state just to pass it to children.
- Do not import query keys into components; invalidation belongs in API mutation hooks.
- Do not use React Context for mutable state. Context is only for stable values that do not change during app lifetime.
- Do not add Zustand unless state is truly global, cross-feature, or cross-route and other ownership options are insufficient.
- Do not use Zustand as an event bus for mutation results.

## Ownership Order

1. React Query hooks under `src/api/<domain>` for server/cache state.
2. React Router params or search params for route/navigation state.
3. Nearest common page component plus focused hooks for page workflow state.
4. Local `useState` or React Hook Form state for component-only state.
5. Small domain-specific Zustand store only for cross-route client state with no server backing.
6. React Context only for stable constants or immutable services.
