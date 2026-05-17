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
