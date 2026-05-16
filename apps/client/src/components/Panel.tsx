import cls from "classnames";
import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  title: string;
  wide?: boolean;
};

export function Panel({ children, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", {
        "lg:col-span-2": wide,
      })}
    >
      <h2 className="mb-4 text-base font-semibold tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
