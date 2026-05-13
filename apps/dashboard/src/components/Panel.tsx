import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  title: string;
  wide?: boolean;
};

export function Panel({ children, title, wide = false }: PanelProps) {
  return (
    <section
      className={`rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-5 shadow-[0_24px_80px_rgb(23_32_51_/_8%)] ${wide ? "lg:col-span-2" : ""}`}
    >
      <h2 className="mb-4 text-xl font-black tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
