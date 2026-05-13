import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
};

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <span className="block text-sm font-black uppercase tracking-[0.08em] text-stone-600">
      {children}
    </span>
  );
}
