# Client Component Rules

Rules for React component boundaries in `apps/client`.

## Always

- Extract components when UI repeats or a named component makes screen composition clearer.
- Keep shared client components in `src/components`.
- Keep context-independent utilities and reusable hooks in `src/core/<category>/<name>.ts`, with one exported function or hook per file.
- Keep route layouts that wrap nested routes in `src/layouts/<LayoutName>`.
- Keep route-level screens in `src/pages`.
- Keep page-specific components and hooks under `src/pages/<PageName>` when they are not shared outside that page.
- Import `src/core` utilities and hooks from their direct file path; do not add `index.ts` barrels under `src/core`.
- Keep React component files in `apps/client` at or below 400 lines; split larger files by real UI responsibility before they become god components.
- Keep component props small and explicit.
- Prefer `children` for layout wrappers such as cards, shells, and empty states.
- Prefer explicit JSX over array-driven rendering for a small, fixed set of known UI items.
- Extract custom hooks for repeated or stateful UI behavior.
- Turn repeated form field label/control/hint/error markup into small primitives before copying it again.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and `ref`.

## Never

- Do not extract one-off UI when it adds indirection without reuse, naming clarity, or state-boundary value.
- Do not turn every extraction into a broad component library.
- Do not move page, domain, route, or API-specific helpers into `src/core`.
- Do not let route components become god components.
- Do not fix a god component by moving all state and effects into a god provider or god hook.
- Do not build artificial arrays just to render a handful of fixed, known navigation or action items.
- Do not use React Context for mutable UI state.
- Do not copy fetched React Query data into component state just to pass it down.

## Data-Driven Rendering

- Use arrays and `.map()` when rendering API data, dynamic collections, long repeated groups, or lists whose members are not all known at author time.
- Render items directly when the UI is a short, fixed set of known product actions or navigation entries.
- Split large files by ownership such as layout shell, sidebar, selectors, form, list, detail, and helper hooks; do not hide a large component behind a single large hook.

## Core Utilities

- Use `src/core/date`, `src/core/json`, `src/core/strings`, `src/core/validation`, or `src/core/hooks` only for helpers that are independent of Capture Flag domain context.
- Keep tests for each core helper in `src/core/<category>/__tests__/<name>.test.ts`.
- Prefer direct imports such as `../../core/json/formatJson` over barrels or grouped core imports.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run build` after component moves.
