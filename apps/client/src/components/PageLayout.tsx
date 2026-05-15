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
    <>
      <PageHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </>
  );
}
