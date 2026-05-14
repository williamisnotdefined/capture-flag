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
