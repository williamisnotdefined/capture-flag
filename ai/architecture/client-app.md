# Client App Architecture

`apps/client` is a Vite React application for the Capture Flag platform UI.

## Entry And Routing

- `src/main.tsx` owns top-level providers.
- `src/router.tsx` owns React Router route definitions.
- `src/layouts` contains route layout wrappers that render shared shells, navigation, headers, and nested `<Outlet />` regions.
- `src/pages` contains route-level screens.
- `src/components` contains shared UI used by multiple pages or sections.
- `src/core` contains context-independent client utilities and reusable hooks organized by category.
- `src/api` contains client request functions, React Query hooks, operation barrels, domain barrels, and domain query keys.
- `src/routing` contains route path and route context helpers shared by pages and layouts.
- `src/stories` contains shared Storybook fixtures and API mocks, not component stories.
- `src/test` contains shared Vitest and Testing Library helpers.
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
- API request and hook tests mock successful responses and API errors instead of reaching a real backend.
- Route params and server state are combined by `useRouteContext` for selected resources and redirect-safe navigation paths.
- Permission gates in the client are UX only; API guards and services remain authoritative.

## UI Composition

- Route components compose page sections and own screen-level flow.
- Repeated panels, forms, controls, lists, and empty states move into named components.
- React component files should stay at or below 400 lines by splitting real responsibilities into focused files.
- Short, fixed navigation or action sets should be rendered explicitly instead of through artificial arrays.
- Page-specific components stay colocated under the page folder until reused elsewhere.
- Layout-specific components stay colocated under `src/layouts/<LayoutName>` until reused by another layout or page.
- Shared primitives live under `src/components` and are imported directly through aliases such as `@components/Button`.
- Member management uses shared `components/members` primitives with page-specific role options.
- Feature flag and segment page internals stay colocated under their page folders until reused.
- Storybook stories live in a `stories/` child folder beside the source area they cover.
- Route-level and cross-page grouping stories live in `src/pages/stories`.
- Shared Storybook data and fetch mocks live in `src/stories` and are reused by stories and page tests.

## Shared Core Utilities

- Context-independent helpers and reusable client hooks live under `src/core/<category>/<name>.ts`.
- Current core categories include `date`, `json`, `strings`, `validation`, and `hooks`.
- Each core file exports one function or hook; import it from the direct file path such as `src/core/date/toDate`.
- Do not add `index.ts` barrels under `src/core`; multiple helpers require multiple explicit imports.
- Core tests live under `src/core/<category>/__tests__/<name>.test.ts` next to the category they cover.
- Client tests live in `__tests__/` child folders beside the source area they cover, mirroring Storybook `stories/` folders.
- Shared test setup and helpers live under `src/test` and provide Testing Library render helpers, React Query providers, and fetch response mocks.
- Coverage is run with `npm --workspace @capture-flag/client run test:coverage` and should stay at 90% or higher for configured client targets.
- Page, domain, API, or route-specific helpers stay colocated with their owning feature until they become context-independent reuse.

## Client Test And Story Layout

- API request and hook tests live in `src/api/__tests__` and cover operation behavior through mocked fetch responses.
- Shared component tests live in `src/components/__tests__`; member component tests live in `src/components/members/__tests__`.
- Page tests live in `src/pages/<PageName>/__tests__` when they cover one page folder.
- Page subsection tests live in `src/pages/<PageName>/<section>/__tests__` when they cover colocated page internals such as feature flags or segments.
- Root-level client tests live in `src/__tests__` only for source files owned directly by `src`, such as `permissions.ts`.
- Shared component stories live in `src/components/stories`; member component stories live in `src/components/members/stories`.
- Layout stories live in `src/layouts/<LayoutName>/stories`.
- Page and page subsection stories live in the owning page folder's `stories/` child folder.
- Cross-page route or panel grouping stories live in `src/pages/stories` and use route parameters plus shared mock data to render realistic page states.
- Do not place component stories in `src/stories`; that folder is reserved for shared Storybook data, routes, and API mocks.

## Form Flow

- React Hook Form owns field state and submission.
- Zod schemas parse and validate form values.
- API mutation hooks submit normalized payloads and refresh server state.
