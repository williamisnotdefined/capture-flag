import { Button } from "@components/Button";
import type { Column } from "@tanstack/react-table";
import cls from "classnames";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { HTMLAttributes } from "react";

type ColumnHeaderProps<TData, TValue> = HTMLAttributes<HTMLDivElement> & {
  column: Column<TData, TValue>;
  title: string;
};

export function ColumnHeader<TData, TValue>({
  className,
  column,
  title,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cls("flex items-center", className)}>
      <Button
        aria-label={`Ordenar por ${title}`}
        className="-ml-2 h-8 px-2 text-foreground shadow-none data-[state=open]:bg-accent"
        onClick={(event) => {
          event.stopPropagation();
          column.toggleSorting(sorted === "asc");
        }}
        type="button"
        variant="ghost"
      >
        <span>{title}</span>
        {sorted === "desc" ? (
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
        ) : sorted === "asc" ? (
          <ArrowUp aria-hidden="true" className="h-4 w-4" />
        ) : (
          <ChevronsUpDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
