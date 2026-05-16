import cls from "classnames";
import type { ComponentPropsWithRef } from "react";

const fieldClassName =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

const textareaClassName =
  "flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

export function TextInput({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cls(fieldClassName, className)} {...props} />;
}

export function SelectInput({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={cls(fieldClassName, className)} {...props} />;
}

export function TextareaInput({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={cls(textareaClassName, className)} {...props} />;
}
