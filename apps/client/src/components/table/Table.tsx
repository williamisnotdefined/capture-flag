import { type Table as ReactTable, type Row, flexRender } from "@tanstack/react-table";
import cls from "classnames";
import type { ReactNode } from "react";
import {
  PrimitiveClickableTableRow,
  PrimitiveTable,
  PrimitiveTableBody,
  PrimitiveTableCell,
  PrimitiveTableHead,
  PrimitiveTableHeader,
  PrimitiveTableRow,
} from "./PrimitiveTable";

type TableProps<TData> = {
  emptyMessage: ReactNode;
  getRowAriaLabel?: (row: Row<TData>) => string;
  getRowClassName?: (row: Row<TData>) => string | undefined;
  getRowState?: (row: Row<TData>) => string | undefined;
  onRowActivate?: (row: Row<TData>) => void;
  rowActivationRole?: "button" | "link";
  table: ReactTable<TData>;
  tableClassName?: string;
};

export function Table<TData>({
  emptyMessage,
  getRowAriaLabel,
  getRowClassName,
  getRowState,
  onRowActivate,
  rowActivationRole = "button",
  table,
  tableClassName,
}: TableProps<TData>) {
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <PrimitiveTable className={tableClassName}>
        <PrimitiveTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <PrimitiveTableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <PrimitiveTableHead
                  aria-sort={getAriaSort(header.column.getIsSorted())}
                  className={cls(
                    header.column.columnDef.meta?.className,
                    header.column.columnDef.meta?.thClassName,
                  )}
                  colSpan={header.colSpan}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </PrimitiveTableHead>
              ))}
            </PrimitiveTableRow>
          ))}
        </PrimitiveTableHeader>
        <PrimitiveTableBody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const state = getRowState?.(row) ?? (row.getIsSelected() ? "selected" : undefined);
              const className = getRowClassName?.(row);
              const cells = row.getVisibleCells().map((cell) => (
                <PrimitiveTableCell
                  className={cls(
                    cell.column.columnDef.meta?.className,
                    cell.column.columnDef.meta?.tdClassName,
                  )}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </PrimitiveTableCell>
              ));

              if (onRowActivate) {
                return (
                  <PrimitiveClickableTableRow
                    activationRole={rowActivationRole}
                    aria-label={getRowAriaLabel?.(row)}
                    className={className}
                    data-state={state}
                    key={row.id}
                    onActivate={() => onRowActivate(row)}
                  >
                    {cells}
                  </PrimitiveClickableTableRow>
                );
              }

              return (
                <PrimitiveTableRow className={className} data-state={state} key={row.id}>
                  {cells}
                </PrimitiveTableRow>
              );
            })
          ) : (
            <PrimitiveTableRow>
              <PrimitiveTableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={visibleColumnCount}
              >
                {emptyMessage}
              </PrimitiveTableCell>
            </PrimitiveTableRow>
          )}
        </PrimitiveTableBody>
      </PrimitiveTable>
    </div>
  );
}

function getAriaSort(sorted: false | "asc" | "desc") {
  if (sorted === "asc") {
    return "ascending";
  }

  if (sorted === "desc") {
    return "descending";
  }

  return undefined;
}
