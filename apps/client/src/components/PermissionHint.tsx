import type { ReactNode } from "react";

type PermissionHintProps = {
  children: ReactNode;
};

export function PermissionHint({ children }: PermissionHintProps) {
  return <p className="mt-3 text-sm text-muted-foreground">{children}</p>;
}
