# Good Client Component

Source: `apps/client/src/components/Button.tsx` (sha256: `f361226c2c1699e5aac9463a502bd7cfec3bb1daa7cbcc53f5a2a2638b40598a`)
Source: `apps/client/src/components/Panel.tsx` (sha256: `c176769bcb46e8b6f10bc2b1206c54412b9c495efd8d467771001594e0e27050`)

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

const baseButtonClassName =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const buttonClassNames: Record<ButtonVariant, string> = {
  danger:
    "border border-transparent bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
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
export function Panel({ children, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls("rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm", {
        "lg:col-span-2": wide,
      })}
    >
      <h2 className="mb-4 text-lg leading-none font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
```

This keeps layout composition explicit through `children` and preserves product visual language.
