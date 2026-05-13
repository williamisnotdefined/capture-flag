# Dashboard Componentization

Use this skill when editing repeated UI in `apps/dashboard`.

## Rules

- Extract components when UI is repeated or when a named component makes screen composition clearer.
- Keep one-off UI inline when extraction would add indirection without reuse.
- Put shared dashboard components in `src/components`.
- Put route-level screens in `src/pages`.
- Keep component props small and explicit.
- Prefer composition through `children` for layout wrappers such as cards, shells, and empty states.
- Do not create broad component libraries until repeated usage proves the need.
- Keep form submission helpers close to the screen unless reused by multiple screens.

## Good Candidates

- Application shell and brand header.
- Repeated panel/card wrappers.
- Repeated empty/list states.
- Repeated labeled selects and simple create-name forms.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/dashboard run build` after component moves.
