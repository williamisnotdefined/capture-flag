import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

type UseTableOptions<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  enablePagination?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  getRowId?: (row: TData) => string;
  globalFilterFn?: FilterFn<TData>;
  initialColumnVisibility?: VisibilityState;
  initialPageSize?: number;
};

export function useTable<TData>({
  columns,
  data,
  enablePagination = true,
  enableRowSelection = false,
  getRowId,
  globalFilterFn,
  initialColumnVisibility = {},
  initialPageSize = 10,
}: UseTableOptions<TData>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  return useReactTable({
    columns,
    data,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting,
    },
  });
}
