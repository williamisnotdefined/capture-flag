import type { ComponentPropsWithRef } from "react";
import { classNames } from "./classNames";

const fieldClassName =
  "rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55";

export function TextInput({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={classNames(fieldClassName, className)} {...props} />;
}

export function SelectInput({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={classNames(fieldClassName, className)} {...props} />;
}

export function TextareaInput({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={classNames(fieldClassName, className)} {...props} />;
}
