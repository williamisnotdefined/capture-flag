# Client Tailwind CSS v4

Use this skill when styling `apps/client`.

## Rules

- Use Tailwind CSS v4 through `@tailwindcss/vite` and `@import "tailwindcss"`.
- Do not add a Tailwind config file unless the design requires custom theme primitives that cannot stay local.
- Prefer utility classes in components over custom CSS selectors.
- Keep global CSS limited to Tailwind import, document defaults, and small base styles.
- Preserve responsive behavior on desktop and mobile.
- Reuse visual patterns through components when the same class set appears repeatedly.
- Avoid generic, interchangeable layouts when designing new screens. Preserve the existing product tone unless the task explicitly asks for a redesign.

## Client Convention

- `src/styles.css` imports Tailwind and holds global base styles only.
- Components own their layout and visual treatment with `className` utilities.
- Use semantic HTML first, then utilities for spacing, color, layout, and states.

## Verification

- Run `npm --workspace @capture-flag/client run build` after Tailwind changes.
- Check mobile breakpoints for client grids, forms, and tables.
