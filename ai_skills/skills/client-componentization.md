# Client Componentization

Use this skill when editing repeated UI, large components, route-level screens, or form-heavy UI in `apps/client`.

## Rules

- Extract components when UI is repeated or when a named component makes screen composition clearer.
- Extract page sections when the extraction isolates a clear responsibility, reduces prop drilling, or makes the parent read as composition.
- Keep one-off UI inline only when extraction would add indirection without reuse, naming clarity, or state boundary benefits.
- Put shared client components in `src/components`.
- Put route-level screens in `src/pages`.
- Put page-specific components and hooks under `src/pages/<PageName>` when they are not shared outside that page.
- Keep component props small and explicit.
- Prefer composition through `children` for layout wrappers such as cards, shells, and empty states.
- Prefer DRY componentization for repeated UI, repeated class sets, or repeated behavior instead of copying markup until a later cleanup.
- Do not turn every extraction into a broad component library; keep components local until they are truly shared.
- Keep form submission helpers close to the owning form or feature unless reused by multiple screens.
- Treat route components as composition owners, not god components. Move panels, forms, lists, mutation handlers, and feature-specific behavior into named child components or hooks.
- Do not concentrate many unrelated hooks in a route component. Move data hooks to the component or hook that owns that data boundary.
- Avoid prop drilling through multiple layers. Lift state only to the nearest explicit consumers, or colocate it with the component/hook that owns the behavior.
- Do not fix a god component by moving all state and effects into a god provider or god hook. Split ownership by explicit consumers, small hooks, and feature sections.
- Do not use React Context for mutable UI state. Context is only for stable values that do not change and will not rerender the whole subtree.
- Extract custom hooks for repeated or stateful UI behavior such as clipboard copy messages, disclosure state, debounced inputs, or selection reconciliation.
- Keep React Query server state in query hooks; avoid copying fetched data into component state just to pass it down.
- When a page grows into multiple independent sections, prefer `src/pages/<PageName>/index.ts` plus colocated page components instead of a single large file.
- When a component grows into multiple forms or list/detail regions, prefer `src/components/<ComponentName>/index.ts` plus colocated subcomponents.
- Repeated Tailwind class sets for inputs, selects, textareas, buttons, errors, and hints should become shared primitives before adding more copies.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and `ref` so they work with React Hook Form registration.
- Keep domain-specific parsing, schemas, and payload normalization colocated with the feature unless reused across features.

## Good Candidates

- Application shell and brand header.
- Repeated panel/card wrappers.
- Repeated empty/list states.
- Repeated labeled selects and simple create-name forms.
- Repeated form fields with identical validation/error rendering.
- Repeated action buttons and disabled/pending visual treatment.
- Large page sections such as organization/project panels, member management, SDK key management, and feature flag forms.
- Small page-specific hooks for selected organization, selected project, selected config, selected environment, clipboard messages, and similar focused behavior.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run build` after component moves.
