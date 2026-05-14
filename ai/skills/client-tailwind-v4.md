# Client Tailwind CSS v4

Use this skill when styling `apps/client` with Tailwind CSS v4.

## Goal

Preserve the existing product visual language while using Tailwind utilities and responsive behavior correctly.

## Read First

- `ai/rules/client-styling-rules.md`
- `ai/rules/client-component-rules.md`
- `ai/architecture/client-app.md`
- `ai/examples/good-client-component.md`

## Workflow

- Inspect nearby components for existing spacing, color, border, and state patterns.
- Keep global CSS limited to Tailwind import and small base styles.
- Put layout and visual treatment in component `className` utilities.
- Extract repeated visual patterns into focused components when repetition is real.
- Check desktop and mobile layouts before finishing.

## Expected Output

- No new Tailwind config unless a concrete design primitive requires it.
- No broad design-system abstraction unless existing repetition justifies it.
- Styling remains semantic HTML plus Tailwind utilities.

## Verification

- Run `npm --workspace @capture-flag/client run build`.
- Check mobile breakpoints for changed grids, forms, and tables when feasible.
