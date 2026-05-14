# Client Styling Rules

Rules for Tailwind CSS v4 and class composition in `apps/client`.

## Always

- Use Tailwind CSS v4 through `@tailwindcss/vite` and `@import "tailwindcss"`.
- Keep global CSS limited to Tailwind import, document defaults, and small base styles.
- Prefer utility classes in components over custom CSS selectors.
- Preserve responsive behavior on desktop and mobile.
- Use the `classnames` package for conditional class composition.
- Import `classnames` as `cls` with `import cls from "classnames";`.
- Use the object form for conditional classes: `cls("base", { "active": isActive })`.
- Keep static Tailwind class sets as plain strings when there are no conditions.

## Never

- Do not add a Tailwind config file unless custom theme primitives cannot stay local.
- Do not add local `classNames`, `cn`, or wrapper helpers without a concrete repeated need.
- Do not use template literals only to append conditional classes.
- Do not turn repeated class sets into broad design-system abstractions before reuse is real.
- Do not create generic, interchangeable layouts when the existing product tone should be preserved.

## Verification

- Search changed files for local class-name helpers before finishing.
- Run `npm --workspace @capture-flag/client run build` after styling changes.
