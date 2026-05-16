import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const badgeClassNames: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  destructive: "border-transparent bg-destructive text-white",
  outline: "border-border text-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
};

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cls(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow]",
        badgeClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
