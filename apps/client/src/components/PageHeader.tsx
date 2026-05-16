import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type PageHeaderProps = {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
