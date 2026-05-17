import cls from "classnames";
import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";

type SelectionCheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "checked" | "type"> & {
  checked: boolean | "indeterminate";
};

export function SelectionCheckbox({
  checked,
  className,
  onClick,
  onKeyDown,
  ...props
}: SelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return (
    <input
      checked={checked === true}
      className={cls(
        "h-4 w-4 cursor-pointer rounded border border-border bg-background accent-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        onKeyDown?.(event);
      }}
      ref={inputRef}
      type="checkbox"
      {...props}
    />
  );
}
