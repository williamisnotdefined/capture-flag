# Good Client API Operation

Source: `apps/client/src/api/projects/createProject/createProject.ts` (sha256: `5510aadbf7212a2153d02de001b7211e3227050b9833b9d74f46ea522767a38e`)
Source: `apps/client/src/api/projects/createProject/useCreateProject.ts` (sha256: `82695169e47aa65b9090e27d5acebcb91b89d5326f3bdcbffe700de16cc74af6`)
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
