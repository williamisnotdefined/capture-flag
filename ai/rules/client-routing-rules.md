# Client Routing Rules

Rules for route changes in `apps/client`.

## Always

- Use React Router for page navigation and route rendering.
- Keep top-level providers in `src/main.tsx`.
- Keep the router definition in `src/router.tsx`.
- Add route modules as named exports compatible with the local `lazyRoute()` helper in `src/router.tsx`.
- Keep route layouts that own shared shells, sidebars, headers, and nested `<Outlet />` rendering in `src/layouts`.
- Keep route-level screens under `src/pages`.
- Prefer folder route modules with `index.ts` named exports for multi-file pages; simple one-file pages may stay as direct page files.
- Prefer `Link` and `NavLink` for internal navigation.
- Preserve direct URL loading for every route.
- Keep `QueryClientProvider` outside the router so routes share one React Query client.
- Keep route path builders, search-param keys, and search-param mutation helpers in `src/routing/routePaths.ts`.
- Use `src/routing/useRouteContext.ts` to compose route params, search params, and server state for selected organization/project/config/environment resources.
- Use React Router search params for route-specific selection state that should survive reloads or links, such as SDK key config/environment selection and audit-log project scope.

## Never

- Do not use plain anchors for internal client navigation.
- Do not move reusable UI into route files when it belongs under `src/components`.
- Do not place route layout wrappers under `src/pages`; reserve `src/pages` for final route screens.
- Do not add redirects unless they encode real product behavior; existing product redirects are `/` to `/organizations` and catch-all `*` to `/`.
- Do not put route-specific screen logic into shared components.
- Do not duplicate selected route-resource derivation in pages when an existing `useRouteContext` helper covers it.

## Verification

- Run `npm --workspace @capture-flag/client run build` after route changes.
- Manually check `/` and every new route from a cold page load when feasible.
