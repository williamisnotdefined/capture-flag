import type { ReactNode } from "react";

type FieldErrorProps = {
  children?: ReactNode;
};

export function FieldError({ children }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return <p className="text-sm font-semibold text-red-700">{children}</p>;
}
