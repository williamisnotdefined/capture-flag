import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
};

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <span className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
      {children}
    </span>
  );
}
