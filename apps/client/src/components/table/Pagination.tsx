import { Button } from "@components/Button";
import { SelectInput } from "@components/FormControls";
import type { Table } from "@tanstack/react-table";
import cls from "classnames";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect } from "react";

type PaginationProps<TData> = {
  className?: string;
  pageSizeOptions?: readonly number[];
  table: Table<TData>;
};

export function Pagination<TData>({
  className,
  pageSizeOptions = [10, 20, 50],
  table,
}: PaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalPages = Math.max(1, table.getPageCount());
  const currentPage = Math.min(pageIndex + 1, totalPages);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  useEffect(() => {
    if (pageIndex >= totalPages) {
      table.setPageIndex(totalPages - 1);
    }
  }, [pageIndex, table, totalPages]);

  return (
    <div
      className={cls(
        "flex items-center justify-between gap-4 px-2 max-lg:flex-col-reverse",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between lg:w-auto">
        <div className="flex items-center gap-2">
          <SelectInput
            className="h-8 w-18"
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
          <p className="hidden text-sm font-medium whitespace-nowrap sm:block">Rows per page</p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex w-28 items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="hidden h-8 w-8 p-0 md:inline-flex"
            disabled={!canPreviousPage}
            onClick={() => table.setPageIndex(0)}
            type="button"
            variant="secondary"
          >
            <span className="sr-only">Primeira pagina</span>
            <ChevronsLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button
            className="h-8 w-8 p-0"
            disabled={!canPreviousPage}
            onClick={() => table.previousPage()}
            type="button"
            variant="secondary"
          >
            <span className="sr-only">Pagina anterior</span>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Button>
          {pageNumbers.map((pageNumber) =>
            typeof pageNumber === "string" ? (
              <span className="px-1 text-sm text-muted-foreground" key={pageNumber}>
                ...
              </span>
            ) : (
              <Button
                className="h-8 min-w-8 px-2"
                key={pageNumber}
                onClick={() => table.setPageIndex(pageNumber - 1)}
                type="button"
                variant={currentPage === pageNumber ? "primary" : "secondary"}
              >
                <span className="sr-only">Ir para pagina {pageNumber}</span>
                {pageNumber}
              </Button>
            ),
          )}
          <Button
            className="h-8 w-8 p-0"
            disabled={!canNextPage}
            onClick={() => table.nextPage()}
            type="button"
            variant="secondary"
          >
            <span className="sr-only">Proxima pagina</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button
            className="hidden h-8 w-8 p-0 md:inline-flex"
            disabled={!canNextPage}
            onClick={() => table.setPageIndex(totalPages - 1)}
            type="button"
            variant="secondary"
          >
            <span className="sr-only">Ultima pagina</span>
            <ChevronsRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-right", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis-left",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ] as const;
}
