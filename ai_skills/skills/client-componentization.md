# Client Componentization

Use this skill when editing repeated UI, large components, route-level screens, or form-heavy UI in `apps/client`.

## Goal

Split UI by real ownership and reuse without creating a broad component library or hiding state in god hooks/providers.

## Read First

- `ai_skills/rules/client-component-rules.md`
- `ai_skills/rules/client-state-rules.md`
- `ai_skills/rules/client-form-rules.md`
- `ai_skills/architecture/client-app.md`
- `ai_skills/examples/good-client-component.md`
- `ai_skills/examples/good-client-form.md`

## Workflow

- Identify whether the change is shared UI, page-specific UI, form behavior, or state ownership cleanup.
- Keep one-off UI inline unless extraction improves reuse, naming, or state boundaries.
- Move shared primitives to `src/components` and page-specific pieces under the owning page folder.
- Prefer small child components and focused hooks over a single large route component.
- Reuse existing form and visual primitives before adding new ones.

## Expected Output

- Route components read as composition.
- Props remain explicit and small.
- Server state remains in React Query hooks.
- Mutable UI state stays local, nearest-owner, or in focused hooks.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run build`.
