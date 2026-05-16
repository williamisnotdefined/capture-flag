import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

type PageLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export function PageLayout({
  actions,
  children,
  contentClassName,
  description,
  eyebrow,
  title,
}: PageLayoutProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <PageHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />
      <div className={contentClassName ?? "flex flex-col gap-4"}>{children}</div>
    </div>
  );
}
