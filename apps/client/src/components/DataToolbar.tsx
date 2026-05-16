import cls from "classnames";
import { ChevronDown, PlusCircle, Search } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { TextInput } from "./FormControls";

type DataToolbarProps = {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DataToolbar({ actions, children, className }: DataToolbarProps) {
  return (
    <div className={cls("flex items-center justify-between gap-2", className)}>
      <div className="flex flex-1 flex-col-reverse items-start gap-2 sm:flex-row sm:items-center">
        {children}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

type SearchFieldProps = ComponentPropsWithoutRef<"input">;

export function SearchField({ className, ...props }: SearchFieldProps) {
  return (
    <div className="relative block w-full sm:w-auto">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <TextInput className={cls("h-8 w-full pl-9 sm:w-64", className)} {...props} />
    </div>
  );
}

type FilterSelectProps = ComponentPropsWithoutRef<"select"> & {
  label: string;
  valueLabel?: string;
};

export function FilterSelect({
  children,
  className,
  disabled,
  label,
  valueLabel,
  ...props
}: FilterSelectProps) {
  return (
    <label
      className={cls(
        "relative inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground",
        { "pointer-events-none opacity-50": disabled },
        className,
      )}
    >
      <PlusCircle aria-hidden="true" className="h-4 w-4" />
      <span>{label}</span>
      {valueLabel ? (
        <span className="rounded-sm bg-secondary px-1 font-normal text-secondary-foreground">
          {valueLabel}
        </span>
      ) : null}
      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
