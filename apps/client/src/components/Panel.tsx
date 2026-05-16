import cls from "classnames";
import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  showTitle?: boolean;
  title: string;
  wide?: boolean;
};

export function Panel({ children, className, showTitle = true, title, wide = false }: PanelProps) {
  return (
    <section
      className={cls("grid gap-4 text-foreground", className, {
        "lg:col-span-2": wide,
      })}
    >
      {showTitle ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
