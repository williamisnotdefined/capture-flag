import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ShellProps = {
  children: ReactNode;
  title: string;
};

export function Shell({ children, title }: ShellProps) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 font-black text-white no-underline"
          to="/"
        >
          CF
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
      </div>
      {children}
    </div>
  );
}
