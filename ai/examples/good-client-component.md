# Good Client Component

Source: `apps/client/src/components/Button.tsx` (sha256: `7e1bcb1c45c5d1a5610f108be5028ce68d34ded2c394d326428eca08702a992d`)
Source: `apps/client/src/components/Panel.tsx` (sha256: `c0dfcd9d6984e9741af7abe91c60ad8bcb30e4d8f18c3c1456bdea5882d2472f`)

Why this is canonical:

- Accepts native element props instead of inventing a custom prop surface.
- Keeps variants explicit and local to the primitive.
- Uses `classnames` as `cls` for optional classes.

Canonical shared component patterns from `apps/client/src/components`.

## Button Primitive

```tsx
import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const baseButtonClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const buttonClassNames: Record<ButtonVariant, string> = {
  danger:
    "border border-transparent bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
  ghost:
    "border border-transparent bg-transparent text-foreground shadow-none hover:bg-accent hover:text-accent-foreground",
  primary: "border border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={cls(baseButtonClassName, buttonClassNames[variant], className)} {...props} />
  );
}
```

This accepts native button props, keeps variants explicit, and uses `cls` for optional classes.

## Panel Wrapper

```tsx
export function Panel({ children, className, showTitle = true, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls("grid gap-4 text-foreground", className, {
        "lg:col-span-2": wide,
      })}
    >
      {showTitle ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
```

This keeps layout composition explicit through `children`, accepts optional native composition through `className`, and preserves product visual language.
