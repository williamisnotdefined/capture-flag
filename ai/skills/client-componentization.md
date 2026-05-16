# Client Componentization

Use this skill when adding, changing, extracting, or reusing React components, repeated UI, large components, route-level screens, or form-heavy UI in `apps/client`.

## Goal

Split UI by real ownership and reuse without creating a broad component library or hiding state in god hooks/providers.

## Read First

- `ai/rules/client-component-rules.md`
- `ai/rules/client-state-rules.md`
- `ai/rules/client-form-rules.md`
- `ai/architecture/client-app.md`
- `ai/examples/good-client-component.md`
- `ai/examples/good-client-form.md`

## Workflow

- Identify whether the change is shared UI, page-specific UI, form behavior, or state ownership cleanup.
- Keep one-off UI inline unless extraction improves reuse, naming, or state boundaries.
- Move shared primitives to `src/components`, page-specific pieces under the owning page folder, and layout-specific pieces under the owning layout folder.
- Prefer small child components and focused hooks over a single large route component.
- Reuse existing form and visual primitives before adding new ones.
- Add or update the matching Storybook story for every changed component.
- Place Storybook stories under the owning `stories/` child folder that matches the component's source area.
- Expose Storybook controls or actions for every public prop explicitly declared by the component.
- Reuse shared Storybook mock data and route parameters from `src/stories` for route, layout, and page stories.

## Expected Output

- Route components read as composition.
- Props remain explicit and small.
- Server state remains in React Query hooks.
- Mutable UI state stays local, nearest-owner, or in focused hooks.
- Component stories document normal, empty, disabled, permission-limited, and error states when those states exist.
- Component stories follow the current `stories/` folder layout instead of loose sibling `*.stories.tsx` files.
- Storybook `args` and `argTypes` stay in sync with declared component props.

## Verification

- Ensure extracted components do not change behavior.
- Run `npm --workspace @capture-flag/client run storybook:build` after Storybook, component, or story changes.
- Run `npm --workspace @capture-flag/client run build`.
