# Client Componentization

Use this skill when editing repeated UI, large components, route-level screens, or form-heavy UI in `apps/client`.

## Rules

- Extract components when UI is repeated or when a named component makes screen composition clearer.
- Keep one-off UI inline when extraction would add indirection without reuse.
- Put shared client components in `src/components`.
- Put route-level screens in `src/pages`.
- Keep component props small and explicit.
- Prefer composition through `children` for layout wrappers such as cards, shells, and empty states.
- Do not create broad component libraries until repeated usage proves the need.
- Keep form submission helpers close to the screen unless reused by multiple screens.
- Treat route components as composition and screen-state owners. Move repeated panels, forms, lists, and cards into named child components.
- When a page grows into multiple independent sections, prefer `src/pages/<PageName>/index.ts` plus colocated page components instead of a single large file.
- When a component grows into multiple forms or list/detail regions, prefer `src/components/<ComponentName>/index.ts` plus colocated subcomponents.
- Repeated Tailwind class sets for inputs, selects, textareas, buttons, errors, and hints should become shared primitives before adding more copies.
- Shared form controls must accept native props, extra `className`, `aria-invalid`, and refs so they work with React Hook Form registration.
- Keep domain-specific parsing, schemas, and payload normalization colocated with the feature unless reused across features.

## Good Candidates

- Application shell and brand header.
- Repeated panel/card wrappers.
- Repeated empty/list states.
- Repeated labeled selects and simple create-name forms.
- Repeated form fields with identical validation/error rendering.
- Repeated action buttons and disabled/pending visual treatment.
- Large page sections such as organization/project panels, member management, SDK key management, and feature flag forms.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run build` after component moves.
