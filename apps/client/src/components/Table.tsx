import cls from "classnames";
import type { ComponentPropsWithoutRef } from "react";

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cls("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return <thead className={cls("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={cls("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cls("border-b border-slate-200 transition-colors hover:bg-slate-50", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cls(
        "h-10 px-2 text-left align-middle text-xs font-medium uppercase tracking-[0.06em] whitespace-nowrap text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return <td className={cls("p-2 align-middle whitespace-nowrap", className)} {...props} />;
}
