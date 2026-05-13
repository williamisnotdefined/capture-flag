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
