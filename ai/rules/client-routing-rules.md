# Client Routing Rules

Rules for route changes in `apps/client`.

## Always

- Use React Router for page navigation and route rendering.
- Keep top-level providers in `src/main.tsx`.
- Keep the router definition in `src/router.tsx`.
- Keep route-level screens under `src/pages`.
- Prefer `Link` and `NavLink` for internal navigation.
- Preserve direct URL loading for every route.
- Keep `QueryClientProvider` outside the router so routes share one React Query client.

## Never

- Do not use plain anchors for internal client navigation.
- Do not move reusable UI into route files when it belongs under `src/components`.
- Do not add redirects unless they encode real product behavior.
- Do not put route-specific screen logic into shared components.

## Verification

- Run `npm --workspace @capture-flag/client run build` after route changes.
- Manually check `/` and every new route from a cold page load when feasible.
