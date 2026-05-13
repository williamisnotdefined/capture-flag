import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { classNames } from "./classNames";

const fieldClassName =
  "rounded-xl border border-[#cec6b8] bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-55";

export const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  function TextInput({ className, ...props }, ref) {
    return <input className={classNames(fieldClassName, className)} ref={ref} {...props} />;
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<"select">>(
  function SelectInput({ className, ...props }, ref) {
    return <select className={classNames(fieldClassName, className)} ref={ref} {...props} />;
  },
);

export const TextareaInput = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  function TextareaInput({ className, ...props }, ref) {
    return <textarea className={classNames(fieldClassName, className)} ref={ref} {...props} />;
  },
);
