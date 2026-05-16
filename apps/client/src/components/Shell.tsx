import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ShellProps = {
  children: ReactNode;
  title: string;
};

export function Shell({ children, title }: ShellProps) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white no-underline"
          to="/"
        >
          CF
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      </div>
      {children}
    </div>
  );
}
