# Client React Router

Use this skill when adding or changing routing in `apps/client`.

## Rules

- Use React Router for page navigation and route rendering.
- Keep the router setup near the client entrypoint, with route UI in page or layout components.
- Keep `QueryClientProvider` outside the router so all routes share the same React Query client.
- Prefer `Link` and `NavLink` over plain anchors for internal client navigation.
- Keep external authentication URLs as regular anchors.
- Keep route components focused on composition and screen-level state. Move reusable UI to `src/components`.
- Add redirects only when they encode real product behavior.
- Preserve direct URL loading for every route.

## Client Convention

- `src/main.tsx` owns top-level providers.
- `src/router.tsx` owns the router definition.
- `src/pages` contains route-level screens.
- `src/components` contains shared UI used by multiple pages or sections.

## Verification

- Run `npm --workspace @capture-flag/client run build` after route changes.
- Manually check that `/` and every new route render from a cold page load.
