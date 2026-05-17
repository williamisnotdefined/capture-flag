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
