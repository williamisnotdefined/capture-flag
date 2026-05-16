import type { ReactNode } from "react";

type FieldErrorProps = {
  children?: ReactNode;
};

export function FieldError({ children }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-700">{children}</p>;
}
