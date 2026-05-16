import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

const baseButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const buttonClassNames: Record<ButtonVariant, string> = {
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800",
  primary: "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
  secondary: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={cls(baseButtonClassName, buttonClassNames[variant], className)} {...props} />
  );
}
