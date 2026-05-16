import cls from "classnames";
import type { ComponentPropsWithRef } from "react";

const fieldClassName =
  "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 aria-invalid:border-red-300 aria-invalid:ring-red-100";

const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 aria-invalid:border-red-300 aria-invalid:ring-red-100";

export function TextInput({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cls(fieldClassName, className)} {...props} />;
}

export function SelectInput({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={cls(fieldClassName, className)} {...props} />;
}

export function TextareaInput({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={cls(textareaClassName, className)} {...props} />;
}
