# Good Client API Operation

Source: `apps/client/src/api/projects/createProject/createProject.ts` (sha256: `40caeb7c462f27c32a307f36118fda8bb5cd92fe8baa627f3c8aa1529e454030`)
Source: `apps/client/src/api/projects/createProject/useCreateProject.ts` (sha256: `5dd47bee95f74f42dc97cd2566c01eebc1a2c22c373150e7057e25e6fe42dbba`)
Source: `apps/client/src/api/projects/createProject/index.ts` (sha256: `50c27c5e6cf5c4a9b979201760aa652d67d5f56785a3ea567f803cc56f3a7a4c`)

Why this is canonical:

- Splits the raw request from the React Query mutation hook.
- Keeps cache invalidation inside the mutation hook.
- Exposes hooks through operation and domain barrels instead of exposing request functions to UI code.

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
