import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ShellProps = {
  children: ReactNode;
  title: string;
};

export function Shell({ children, title }: ShellProps) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link
          className="inline-flex h-9 w-9 items-center justify-center rounded-md no-underline"
          to="/"
        >
          <img alt="Capture Flag" className="h-9 w-9 object-contain" src="/logo.png" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}
