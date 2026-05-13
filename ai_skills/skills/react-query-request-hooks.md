# React Query Request Hooks

Use this skill whenever client API queries or mutations are added or changed.

## Rules

- Group API code by domain and operation under `apps/client/src/api`.
- Split every operation into a request function, a React Query hook, and an operation `index.ts`.
- The request function performs the HTTP call and contains no React imports.
- Query hooks call `useQuery` and consume the request function.
- Mutation hooks call `useMutation`, consume the request function, and own cache invalidation.
- Components must call hooks, not raw request functions or `queryKeys`.
- Components must not manually synchronize server lists after mutations; invalidate the affected query in the mutation hook and let React Query refetch.
- Prefer React Query as the source of truth for server state. Do not mirror query data into Zustand or local component state unless a concrete UI-only draft workflow requires it.
- Domain barrels must export hooks only.
- Keep request functions typed with the response type they return.
- Use `enabled` in query hooks when required IDs or inputs are not available.
- Keep query keys stable in a domain-level `queryKeys.ts` when hooks or mutations share them.

## Naming

- Domain directory: `auth`, `projects`, `configs`, `environments`, `sdkKeys`.
- Operation directory: `getMe`, `getProjects`, `createProject`, `createSdkKey`.
- Request file: `getMe.ts`, `getProjects.ts`, `createProject.ts`.
- Hook file: `useGetMe.ts`, `useGetProjects.ts`, `useCreateProject.ts`.
- Function names match files: `getMe`, `useGetMe`, `createProject`, `useCreateProject`.

## Client Convention

- Operation layout: `apps/client/src/api/<domain>/<operation>/<request>.ts`, `use<Operation>.ts`, `index.ts`.
- Operation `index.ts` exports only the hook for that operation.
- Domain `index.ts` reexports operation hooks for UI imports.
- Domain query keys live in `apps/client/src/api/<domain>/queryKeys.ts`.
- Avoid a central `apps/client/src/api/queryKeys.ts` unless data is genuinely cross-domain.
- UI imports should use domain barrels like `../api/auth` or `../api/projects`.

## Query Example

```ts
// api/auth/getMe/getMe.ts
export function getMe() {
  return apiRequest<MeResponse>("/auth/me");
}
```

```ts
// api/auth/getMe/useGetMe.ts
export function useGetMe() {
  return useQuery({
    queryFn: getMe,
    queryKey: authQueryKeys.me(),
    retry: false,
  });
}
```

```ts
// api/auth/getMe/index.ts
export { useGetMe } from "./useGetMe";
```

```ts
// api/auth/index.ts
export { useGetMe } from "./getMe";
```

## Mutation Example

```ts
// api/projects/createProject/createProject.ts
export function createProject({ name, organizationId }: CreateProjectInput) {
  return postJson<Project>(`/organizations/${organizationId}/projects`, { name });
}
```

```ts
// api/projects/createProject/useCreateProject.ts
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

```ts
// api/projects/createProject/index.ts
export { useCreateProject } from "./useCreateProject";
```

```ts
// api/projects/index.ts
export { useCreateProject } from "./createProject";
export { useGetProjects } from "./getProjects";
```

## Component Usage

```ts
import { useGetMe, useLogout } from "../api/auth";
import { useCreateProject, useGetProjects } from "../api/projects";
```

## Verification

- Search for direct `useQuery`, `useMutation`, raw request, or `queryKeys` usage in components before finishing.
- Check mutation hooks invalidate every query whose server data becomes stale.
- Run `npm --workspace @capture-flag/client run build` after API hook refactors.
