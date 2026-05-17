# Client Component Rules

Rules for React component boundaries in `apps/client`.

## Always

- Extract components when UI repeats or a named component makes screen composition clearer.
- Keep shared client components in `src/components`.
- Keep context-independent utilities and reusable hooks in `src/core/<category>/<name>.ts`, with one exported function or hook per file.
- Keep route layouts that wrap nested routes in `src/layouts/<LayoutName>`.
- Keep route-level screens in `src/pages`.
- Keep page-specific components and hooks under `src/pages/<PageName>` when they are not shared outside that page.
- Import `src/core` utilities and hooks from their direct alias file path such as `@core/json/formatJson`; do not add `index.ts` barrels under `src/core`.
- Import shared components directly through aliases such as `@components/Button`; do not assume a central `src/components/index.ts` barrel exists.
- Keep new or substantially changed React component files in `apps/client` at or below 400 lines; when touching larger existing files, prefer splitting real UI responsibilities instead of expanding them further.
- Keep component props small and explicit.
- Prefer `children` for layout wrappers such as cards, shells, and empty states.
- Prefer explicit JSX over array-driven rendering for a small, fixed set of known UI items.
- Extract custom hooks for repeated or stateful UI behavior.
- Turn repeated form field label/control/hint/error markup into small primitives before copying it again.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and `ref`.
- Add or update Storybook stories when adding or changing reusable, layout, page-specific, or route-level React components in `apps/client`.
- Keep Storybook stories in a `stories/` child folder next to the component folder they cover, using `*.stories.tsx`; route/panel grouping stories belong in the owning route folder's `stories/` folder.
- Add Storybook controls or actions for every public prop explicitly declared by the component; use controls for data props and actions for callbacks.
- Keep shared component stories in `src/components/stories` and member component stories in `src/components/members/stories`.
- Keep layout stories in `src/layouts/<LayoutName>/stories`.
- Keep page or page-section stories in `src/pages/<PageName>/stories` or `src/pages/<PageName>/<section>/stories`.
- Keep cross-page route or panel grouping stories in `src/pages/stories`.
- Keep Storybook fixtures, route constants, and API mocks in `src/stories`; do not put component stories there.

## Never

- Do not extract one-off UI when it adds indirection without reuse, naming clarity, or state-boundary value.
- Do not turn every extraction into a broad component library.
- Do not move page, domain, route, or API-specific helpers into `src/core`.
- Do not let route components become god components.
- Do not fix a god component by moving all state and effects into a god provider or god hook.
- Do not build artificial arrays just to render a handful of fixed, known navigation or action items.
- Do not use React Context for mutable UI state.
- Do not copy fetched React Query data into component state just to pass it down.
- Do not leave component prop changes without matching Storybook `args` and `argTypes` updates.
- Do not place `*.stories.tsx` beside component files when a nearby `stories/` folder is available.

## Data-Driven Rendering

- Use arrays and `.map()` when rendering API data, dynamic collections, long repeated groups, or lists whose members are not all known at author time.
- Render items directly when the UI is a short, fixed set of known product actions or navigation entries.
- Split large files by ownership such as layout shell, sidebar, selectors, form, list, detail, and helper hooks; do not hide a large component behind a single large hook.

## Core Utilities

- Use `src/core/date`, `src/core/json`, `src/core/strings`, `src/core/validation`, or `src/core/hooks` only for helpers that are independent of Capture Flag domain context.
- Keep tests for each core helper in `src/core/<category>/__tests__/<name>.test.ts`.
- Prefer direct alias imports such as `@core/json/formatJson` over barrels or grouped core imports.

## Storybook Layout

- Use one `*.stories.tsx` file per component or cohesive route grouping.
- Use shared mock entities and route strings from `src/stories/mockData.ts` when stories need realistic Capture Flag data.
- Use the Storybook API mock installed by `.storybook/preview.tsx` for route and panel stories that call client API hooks.
- Set route-specific `parameters.router.initialEntries` when a story depends on React Router params.
- Prefer `parameters.layout = "fullscreen"` for route, layout, shell, and panel stories that need app-width context.

## Verification

- Ensure extracted components do not change behavior.
- Check the related Storybook story was added or updated and exposes controls/actions for every public declared prop.
- Run `npm --workspace @capture-flag/client run storybook:build` after Storybook, component, or story changes.
- Run `npm --workspace @capture-flag/client run build` after component moves.
