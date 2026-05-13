# React Query Request Hooks

Use this skill whenever dashboard API queries or mutations are added or changed.

## Rules

- Group API code by domain and operation under `apps/dashboard/src/api`.
- Split every operation into a request function, a React Query hook, and an operation `index.ts`.
- The request function performs the HTTP call and contains no React imports.
- Query hooks call `useQuery` and consume the request function.
- Mutation hooks call `useMutation`, consume the request function, and own cache invalidation.
- Components must call hooks, not raw request functions or `queryKeys`.
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

## Dashboard Convention

- Operation layout: `apps/dashboard/src/api/<domain>/<operation>/<request>.ts`, `use<Operation>.ts`, `index.ts`.
- Operation `index.ts` exports only the hook for that operation.
- Domain `index.ts` reexports operation hooks for UI imports.
- Domain query keys live in `apps/dashboard/src/api/<domain>/queryKeys.ts`.
- Avoid a central `apps/dashboard/src/api/queryKeys.ts` unless data is genuinely cross-domain.
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
- Run `npm --workspace @capture-flag/dashboard run build` after API hook refactors.
