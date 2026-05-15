---
applyTo: "apps/client/**/*.{ts,tsx}"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/client-react-router.md`.

Referenced context:
- `../../ai/rules/client-routing-rules.md`
- `../../ai/rules/client-component-rules.md`
- `../../ai/architecture/client-app.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: client-react-router

## Canonical Skill: `ai/skills/client-react-router.md`

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
- Put route-level UI under `src/pages`.
- Move reusable UI into `src/components` only when it is shared or clarifies composition.
- Use internal router navigation for app routes and plain anchors only for external URLs.

## Expected Output

- Every route can load from a cold URL.
- Top-level providers remain outside route-specific UI.
- Route components compose page sections instead of becoming broad shared components.

## Verification

- Run `npm --workspace @capture-flag/client run build`.
- Manually check `/` and every new route from a cold page load when feasible.

# Referenced Context

## Reference: `ai/rules/client-routing-rules.md`

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

## Reference: `ai/rules/client-component-rules.md`

# Client Component Rules

Rules for React component boundaries in `apps/client`.

## Always

- Extract components when UI repeats or a named component makes screen composition clearer.
- Keep shared client components in `src/components`.
- Keep route-level screens in `src/pages`.
- Keep page-specific components and hooks under `src/pages/<PageName>` when they are not shared outside that page.
- Keep component props small and explicit.
- Prefer `children` for layout wrappers such as cards, shells, and empty states.
- Extract custom hooks for repeated or stateful UI behavior.
- Turn repeated form field label/control/hint/error markup into small primitives before copying it again.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and `ref`.

## Never

- Do not extract one-off UI when it adds indirection without reuse, naming clarity, or state-boundary value.
- Do not turn every extraction into a broad component library.
- Do not let route components become god components.
- Do not fix a god component by moving all state and effects into a god provider or god hook.
- Do not use React Context for mutable UI state.
- Do not copy fetched React Query data into component state just to pass it down.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run build` after component moves.

## Reference: `ai/architecture/client-app.md`

# Client App Architecture

`apps/client` is a Vite React application for the Capture Flag platform UI.

## Entry And Routing

- `src/main.tsx` owns top-level providers.
- `src/router.tsx` owns React Router route definitions.
- `src/pages` contains route-level screens.
- `src/components` contains shared UI used by multiple pages or sections.
- `PlatformLayout` owns the authenticated shell, top-level resource context, and navigation around selected organization, project, config, and environment.

## Route Map

- `/login`: GitHub login screen.
- `/organizations` and `/organizations/:organizationId`: organization selection and organization members.
- `/organizations/:organizationId/projects` and `/organizations/:organizationId/projects/:projectId`: project selection and project members.
- `/organizations/:organizationId/projects/:projectId/environments`: environments for the selected project.
- `/organizations/:organizationId/projects/:projectId/configs` and `/organizations/:organizationId/projects/:projectId/configs/:configId`: configs and public Config JSON preview.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/flags`: feature flags and remote config values.
- `/organizations/:organizationId/projects/:projectId/configs/:configId/segments`: reusable targeting segments.
- `/organizations/:organizationId/projects/:projectId/sdk-keys`: SDK key lifecycle for project configs/environments.
- `/organizations/:organizationId/audit-logs`: organization/project audit log timeline.

## Data Flow

- React Query owns server state such as authenticated user, organizations, projects, configs, environments, SDK keys, members, and feature flags.
- API operations live under `src/api/<domain>/<operation>`.
- Request functions perform HTTP calls and contain no React imports.
- Query and mutation hooks are the UI-facing API.
- Mutation hooks invalidate affected query keys.
- Route params and server state are combined by `useRouteContext` for selected resources and redirect-safe navigation paths.
- Permission gates in the client are UX only; API guards and services remain authoritative.

## UI Composition

- Route components compose page sections and own screen-level flow.
- Repeated panels, forms, controls, lists, and empty states move into named components.
- Page-specific components stay colocated under the page folder until reused elsewhere.
- Shared primitives live under `src/components` and are exported through `src/components/index.ts`.
- Member management uses shared `components/members` primitives with page-specific role options.
- Feature flag and segment page internals stay colocated under their page folders until reused.

## Form Flow

- React Hook Form owns field state and submission.
- Zod schemas parse and validate form values.
- API mutation hooks submit normalized payloads and refresh server state.
