# Client State Management

Use this skill when adding or changing client-side state, React Query data flow, immutable context values, or Zustand stores in `apps/client`.

## Goal

Place each state concern at the narrowest correct owner without duplicating server data or creating mutable global context.

## Read First

- `ai_skills/rules/client-state-rules.md`
- `ai_skills/rules/client-api-hook-rules.md`
- `ai_skills/architecture/client-app.md`
- `ai_skills/examples/good-client-api-operation.md`

## Workflow

- Classify the state as server/cache, route/navigation, page workflow, component-only, cross-route client state, or stable service.
- Keep server state in React Query hooks.
- Keep mutation freshness in mutation hook invalidation.
- Use IDs and derived data instead of duplicated entity objects.
- Add Zustand only after React Query, router state, local state, and focused hooks are insufficient.

## Expected Output

- Components do not copy query data into local state or Zustand just to pass it down.
- Components do not import query keys directly.
- State reset rules live next to the state owner.
- Context values are stable services/constants, not mutable UI state.

## Verification

- Search changed components for copied query data in `useState` or Zustand.
- Search changed components for direct query-key imports.
- Run `npm --workspace @capture-flag/client run build`.
