---
applyTo: "apps/client/**/*.{ts,tsx}"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/react-query-request-hooks.md`.

Referenced context:
- `../../ai/rules/client-api-hook-rules.md`
- `../../ai/rules/client-state-rules.md`
- `../../ai/architecture/client-app.md`
- `../../ai/examples/good-client-api-operation.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: react-query-request-hooks

## Canonical Skill: `ai/skills/react-query-request-hooks.md`

# React Query Request Hooks

Use this skill whenever client API queries or mutations are added or changed.

## Goal

Add or modify client API operations while keeping React Query as the server-state boundary and components free of raw request/query-key usage.

## Read First

- `ai/rules/client-api-hook-rules.md`
- `ai/rules/client-state-rules.md`
- `ai/architecture/client-app.md`
- `ai/examples/good-client-api-operation.md`

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

# Referenced Context

## Reference: `ai/rules/client-api-hook-rules.md`

# Client API Hook Rules

Rules for client API operations in `apps/client/src/api`.

## Always

- Group API code by domain and operation under `apps/client/src/api`.
- Split every operation into a request function, a React Query hook, and an operation `index.ts`.
- Keep request functions free of React imports.
- Keep request functions typed with the response type they return.
- Use shared request helpers from `src/api/client.ts` so private API calls share the `/api/v1` base URL, JSON handling, API error handling, and `credentials: "include"` behavior.
- Use `useQuery` or `useInfiniteQuery` in query hooks according to the API shape, and `useMutation` in mutation hooks.
- Keep query keys stable in a domain-level `queryKeys.ts` when hooks or mutations share them.
- Keep object-valued query-key inputs stable and serializable, such as applied filter DTOs.
- Use `enabled` in query hooks when required IDs or inputs are unavailable.
- Invalidate affected query keys inside mutation hooks.
- Import other domain query keys inside mutation hooks when the mutation makes cross-domain server state stale.
- Use explicit named exports in UI-facing barrels.

## Never

- Do not call raw request functions from components.
- Do not expose request functions from operation or domain barrels used by UI.
- Do not import domain `queryKeys` into components.
- Do not manually synchronize server lists in components after mutations.
- Do not mirror query data into Zustand or local state unless a concrete UI-only draft workflow requires it.
- Do not create a central `src/api/queryKeys.ts` unless data is genuinely cross-domain.
- Do not use `fetch` directly outside `src/api/client.ts` unless the request is intentionally outside the app API contract.

## Layout

- Request file: `apps/client/src/api/<domain>/<operation>/<operation>.ts`.
- Hook file: `apps/client/src/api/<domain>/<operation>/use<Operation>.ts`.
- Operation barrel: `apps/client/src/api/<domain>/<operation>/index.ts`.
- Domain barrel: `apps/client/src/api/<domain>/index.ts`.
- Query keys: `apps/client/src/api/<domain>/queryKeys.ts`.

## Reference: `ai/rules/client-state-rules.md`

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
- Use `useRouteContext` to derive selected organization, project, config, and environment from route params, search params, and React Query data.
- Use search params for route-owned selection that should survive reloads or shared links, such as SDK key config/environment and audit-log project scope.
- Use focused ID-selection hooks such as `useCollectionSelection` for page-local collection selection that does not need to be linkable.
- Move repeated, context-independent client hooks to `src/core/hooks/<hook>.ts` and import them directly from that file.
- Keep state reset rules near the state owner.
- Keep permission gates derived from route-context roles and shared permission helpers; client permission gates are UX only.

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
3. `useRouteContext` for selected route resources derived from navigation state plus server data.
4. Nearest common page component plus focused hooks for page workflow state.
5. Local `useState` or React Hook Form state for component-only state.
6. `src/core/hooks/<hook>.ts` only for repeated hooks that are independent of page/domain context.
7. Small domain-specific Zustand store only for cross-route client state with no server backing.
8. React Context only for stable constants or immutable services.

## Reference: `ai/architecture/client-app.md`

# Client App Architecture

`apps/client` is a Vite React application for the Capture Flag platform UI.

## Entry And Routing

- `src/main.tsx` owns top-level providers.
- `src/router.tsx` owns React Router route definitions.
- Route modules are lazy-loaded through the local `lazyRoute()` helper and should expose named exports.
- `src/layouts` contains route layout wrappers that render shared shells, navigation, headers, and nested `<Outlet />` regions.
- `src/pages` contains route-level screens. Multi-file route screens use folder modules with `index.ts` named exports; simple one-file screens may stay as direct page files.
- `src/components` contains shared UI used by multiple pages or sections.
- `src/core` contains context-independent client utilities and reusable hooks organized by category.
- `src/api` contains client request functions, React Query hooks, operation barrels, domain barrels, and domain query keys.
- `src/routing` contains route path and route context helpers shared by pages and layouts.
- `src/stories` contains shared Storybook fixtures and API mocks, not component stories.
- `src/test` contains shared Vitest and Testing Library helpers.
- `PlatformLayout` owns the authenticated shell, navigation frame, sidebar/header state, logout flow, and nested route outlet.
- Selected organization, project, config, and environment state is derived by route helpers such as `useRouteContext`, not stored in a mutable layout context.

## Route Map

- `/`: redirects to `/organizations`.
- `/login`: GitHub login screen.
- `/organizations` and `/organizations/:organizationId`: organization selection and organization members.
- `/organizations/:organizationId/projects` and `/organizations/:organizationId/projects/:projectId`: project selection and project members.
- `/organizations/:organizationId/projects/:projectId/environments`: environments for the selected project.
- `/organizations/:organizationId/projects/:projectId/configs` and `/organizations/:organizationId/projects/:projectId/configs/:configId`: configs and public Config JSON preview.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/flags`: feature flags and remote config values.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/segments`: reusable targeting segments.
- `/organizations/:organizationId/projects/:projectId/sdk-keys`: SDK key lifecycle for project configs/environments, with selected config/environment in `?configId=` and `?environmentId=` when needed.
- `/organizations/:organizationId/audit-logs`: organization/project audit log timeline, with selected project in `?projectId=` when needed.
- `*`: redirects to `/`.

## Data Flow

- React Query owns server state such as authenticated user, organizations, projects, configs, environments, SDK keys, members, and feature flags.
- API operations live under `src/api/<domain>/<operation>`.
- Request functions perform HTTP calls and contain no React imports.
- Query and mutation hooks are the UI-facing API.
- Query hooks may use `useQuery` or `useInfiniteQuery` according to the API shape.
- Mutation hooks invalidate affected query keys.
- Mutations that affect derived server state may invalidate query keys from multiple API domains inside the mutation hook.
- API request and hook tests mock successful responses and API errors instead of reaching a real backend.
- Route params, search params, and server state are combined by `useRouteContext` for selected resources and redirect-safe navigation paths.
- Permission gates in the client are UX only; API guards and services remain authoritative.

## UI Composition

- Route components compose page sections and own screen-level flow.
- Repeated panels, forms, controls, lists, and empty states move into named components.
- React component files should stay at or below 400 lines by splitting real responsibilities into focused files.
- Short, fixed navigation or action sets should be rendered explicitly instead of through artificial arrays.
- Page-specific components stay colocated under the page folder until reused elsewhere.
- Layout-specific components stay colocated under `src/layouts/<LayoutName>` until reused by another layout or page.
- Shared primitives live under `src/components` and are imported directly through aliases such as `@components/Button`.
- Member management uses shared `components/members` primitives with page-specific role options.
- Feature flag and segment page internals stay colocated under their page folders until reused.
- Storybook stories live in a `stories/` child folder beside the source area they cover.
- Route-level and cross-page grouping stories live in `src/pages/stories`.
- Shared Storybook data and fetch mocks live in `src/stories` and are reused by stories and page tests.

## Shared Core Utilities

- Context-independent helpers and reusable client hooks live under `src/core/<category>/<name>.ts`.
- Current core categories include `date`, `json`, `strings`, `validation`, and `hooks`.
- Each core file exports one function or hook; import it from the direct file path such as `src/core/date/toDate`.
- Do not add `index.ts` barrels under `src/core`; multiple helpers require multiple explicit imports.
- Core tests live under `src/core/<category>/__tests__/<name>.test.ts` next to the category they cover.
- Client tests live in `__tests__/` child folders beside the source area they cover, mirroring Storybook `stories/` folders.
- Shared test setup and helpers live under `src/test` and provide Testing Library render helpers, React Query providers, and fetch response mocks.
- Coverage is run with `npm --workspace @capture-flag/client run test:coverage` and should stay at 90% or higher for configured client targets.
- Page, domain, API, or route-specific helpers stay colocated with their owning feature until they become context-independent reuse.

## Client Test And Story Layout

- API request and hook tests live in `src/api/__tests__` and cover operation behavior through mocked fetch responses.
- Shared component tests live in `src/components/__tests__`; member component tests live in `src/components/members/__tests__`.
- Page tests live in `src/pages/<PageName>/__tests__` when they cover one page folder.
- Page subsection tests live in `src/pages/<PageName>/<section>/__tests__` when they cover colocated page internals such as feature flags or segments.
- Root-level client tests live in `src/__tests__` only for source files owned directly by `src`, such as `permissions.ts`.
- Shared component stories live in `src/components/stories`; member component stories live in `src/components/members/stories`.
- Layout stories live in `src/layouts/<LayoutName>/stories`.
- Page and page subsection stories live in the owning page folder's `stories/` child folder.
- Cross-page route or panel grouping stories live in `src/pages/stories` and use route parameters plus shared mock data to render realistic page states.
- Do not place component stories in `src/stories`; that folder is reserved for shared Storybook data, routes, and API mocks.

## Form Flow

- React Hook Form owns field state and submission.
- Zod schemas parse and validate form values.
- API mutation hooks submit normalized payloads and refresh server state.

## Reference: `ai/examples/good-client-api-operation.md`

# Good Client API Operation

Source: `apps/client/src/api/projects/createProject/createProject.ts` (sha256: `5510aadbf7212a2153d02de001b7211e3227050b9833b9d74f46ea522767a38e`)
Source: `apps/client/src/api/projects/createProject/useCreateProject.ts` (sha256: `82695169e47aa65b9090e27d5acebcb91b89d5326f3bdcbffe700de16cc74af6`)
Source: `apps/client/src/api/projects/createProject/index.ts` (sha256: `50c27c5e6cf5c4a9b979201760aa652d67d5f56785a3ea567f803cc56f3a7a4c`)
Source: `apps/client/src/api/auditLogs/getAuditLogs/useGetAuditLogs.ts` (sha256: `5f97a43166e57aaab8312398364a5dc16754fb210fc4f2f7100a961fb6320588`)
Source: `apps/client/src/api/featureFlags/updateFeatureFlagEnvironmentValue/useUpdateFeatureFlagEnvironmentValue.ts` (sha256: `bfba73c369ba938273edf033880d189a0bea8c459cc69d445ce2ebec70cef741`)

Why this is canonical:

- Splits the raw request from the React Query mutation hook.
- Keeps cache invalidation inside the mutation hook.
- Exposes hooks through operation and domain barrels instead of exposing request functions to UI code.
- Uses `useInfiniteQuery` for cursor-paginated APIs.
- Keeps cross-domain cache invalidation inside mutation hooks when derived server state changes.

Canonical pattern from `apps/client/src/api/projects/createProject`.

## Request Function

```ts
export function createProject({ name, organizationId }: CreateProjectInput) {
  return postJson<Project>(`/organizations/${organizationId}/projects`, { name });
}
```

The request function performs HTTP work only. It does not import React.

## Mutation Hook

```ts
export function useCreateProject({ organizationId, onSuccess }: UseCreateProjectOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createProject({ name, organizationId }),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.list(organizationId) });
      onSuccess?.(project);
    },
  });
}
```

The mutation hook owns cache invalidation. Components consume the hook, not the request function or query keys.

## Operation Barrel

```ts
export { useCreateProject } from "./useCreateProject";
```

Operation and domain barrels expose hooks to UI code.

## Infinite Query Hook

```ts
export function useGetAuditLogs({ enabled = true, filters, organizationId }: UseGetAuditLogsInput) {
  return useInfiniteQuery({
    enabled: Boolean(enabled && organizationId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getAuditLogs({
        filters: {
          ...filters,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        organizationId,
      }),
    queryKey: auditLogQueryKeys.list(organizationId, filters),
  });
}
```

Infinite query hooks still keep raw HTTP work in the request function and use serializable filter DTOs in query keys.

## Cross-Domain Invalidation

```ts
onSuccess: (_value, variables) => {
  void queryClient.invalidateQueries({ queryKey: featureFlagQueryKeys.list(configId) });
  void queryClient.invalidateQueries({
    queryKey: featureFlagQueryKeys.activity(configId, variables.featureFlagId),
  });
  void queryClient.invalidateQueries({
    queryKey: configQueryKeys.preview(configId, variables.environmentId),
  });
  void queryClient.invalidateQueries({ queryKey: auditLogQueryKeys.all });
};
```

When a mutation changes derived server state, the mutation hook imports and invalidates every affected domain query key. Components still do not import query keys.
