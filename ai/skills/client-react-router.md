# Client React Router

Use this skill when adding or changing routing in `apps/client`.

## Goal

Add or change routes without breaking provider ownership, direct URL loading, or page/component boundaries.

## Read First

- `ai/rules/client-routing-rules.md`
- `ai/rules/client-component-rules.md`
- `ai/architecture/client-app.md`

## Workflow

- Inspect `src/main.tsx`, `src/router.tsx`, and the target page before editing.
- Put route definitions in `src/router.tsx`.
- Put final route screens under `src/pages` and route layout wrappers under `src/layouts`.
- Move reusable UI into `src/components` only when it is shared or clarifies composition.
- Use internal router navigation for app routes and plain anchors only for external URLs.

## Expected Output

- Every route can load from a cold URL.
- Top-level providers remain outside route-specific UI.
- Route components compose page sections instead of becoming broad shared components.

## Verification

- Run `npm --workspace @capture-flag/client run build`.
- Manually check `/` and every new route from a cold page load when feasible.
