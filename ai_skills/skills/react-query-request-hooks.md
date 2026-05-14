# React Query Request Hooks

Use this skill whenever client API queries or mutations are added or changed.

## Goal

Add or modify client API operations while keeping React Query as the server-state boundary and components free of raw request/query-key usage.

## Read First

- `ai_skills/rules/client-api-hook-rules.md`
- `ai_skills/rules/client-state-rules.md`
- `ai_skills/architecture/client-app.md`
- `ai_skills/examples/good-client-api-operation.md`

## Workflow

- Identify the API domain and operation name from nearby operations.
- Add or update the request function, hook, operation barrel, domain barrel, and domain query keys as needed.
- Keep request functions private to hooks.
- Put invalidation in mutation hooks, not components.
- Update component imports to consume domain hooks only.

## Expected Output

- UI-facing barrels export hooks only.
- Components do not import raw request functions or query keys.
- Mutations invalidate every query whose server data becomes stale.
- Required IDs use `enabled` or hook options to avoid invalid requests.

## Verification

- Search changed components for direct `useQuery`, `useMutation`, raw request, or `queryKeys` usage.
- Run `npm --workspace @capture-flag/client run build`.
