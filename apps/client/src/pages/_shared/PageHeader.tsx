import type { ReactNode } from "react";
import { Eyebrow } from "../../components";

type PageHeaderProps = {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-5 shadow-[0_18px_60px_rgb(23_32_51_/_8%)] lg:flex-row lg:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
