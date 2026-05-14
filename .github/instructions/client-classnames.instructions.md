---
applyTo: "apps/client/**/*.{ts,tsx}"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/client-classnames.md`.

Referenced context:
- `../../ai/rules/client-styling-rules.md`
- `../../ai/examples/good-client-component.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: client-classnames

## Canonical Skill: `ai/skills/client-classnames.md`

# Client Classnames

Use this skill when adding or changing conditional class names in `apps/client`.

## Goal

Compose conditional Tailwind class names consistently without adding local helper variants.

## Read First

- `ai/rules/client-styling-rules.md`
- `ai/examples/good-client-component.md`

## Workflow

- Keep static class sets as plain strings.
- Use `cls` only when conditional classes or caller-provided `className` need composition.
- Keep class composition close to the component that owns the visual state.
- Reuse existing primitives before creating a new class composition pattern.

## Expected Output

- `classnames` is imported as `cls`.
- No local `classNames`, `cn`, or wrapper helper is added without repeated need.
- Conditional classes use object form where possible.

## Verification

- Search changed files for local class-name helpers.
- Run `npm --workspace @capture-flag/client run build`.

# Referenced Context

## Reference: `ai/rules/client-styling-rules.md`

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

## Reference: `ai/examples/good-client-component.md`

# Good Client Component

Source: `apps/client/src/components/Button.tsx` (sha256: `47e75ad8745a43100aa0e0102f44d08d2e5f3cbd7e45d6732339a7d0ffcf66ab`)
Source: `apps/client/src/components/Panel.tsx` (sha256: `18b9111b4228d35119bc57431c3b07d3d7ebb299670167968b0c970a0878ba8d`)

Why this is canonical:

- Accepts native element props instead of inventing a custom prop surface.
- Keeps variants explicit and local to the primitive.
- Uses `classnames` as `cls` for optional classes.

Canonical shared component patterns from `apps/client/src/components`.

## Button Primitive

```tsx
import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

const buttonClassNames: Record<ButtonVariant, string> = {
  danger:
    "rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-800 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-55",
  primary:
    "rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55",
  secondary:
    "rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-55",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cls(buttonClassNames[variant], className)} {...props} />;
}
```

This accepts native button props, keeps variants explicit, and uses `cls` for optional classes.

## Panel Wrapper

```tsx
export function Panel({ children, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls(
        "rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-5 shadow-[0_24px_80px_rgb(23_32_51_/_8%)]",
        { "lg:col-span-2": wide },
      )}
    >
      <h2 className="mb-4 text-xl font-black tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
```

This keeps layout composition explicit through `children` and preserves product visual language.
