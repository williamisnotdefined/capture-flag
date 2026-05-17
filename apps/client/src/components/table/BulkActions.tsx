import { Badge } from "@components/Badge";
import { Button } from "@components/Button";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type BulkActionsProps<TData> = {
  children: ReactNode;
  selectionLabel: (selectedCount: number) => string;
  table: Table<TData>;
};

export function BulkActions<TData>({ children, selectionLabel, table }: BulkActionsProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      aria-label={selectionLabel(selectedCount)}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      role="toolbar"
    >
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-lg">
        <Button
          aria-label="Limpar selecao"
          className="h-7 w-7 rounded-full p-0"
          onClick={() => table.resetRowSelection()}
          title="Limpar selecao"
          type="button"
          variant="secondary"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
        <div className="h-5 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Badge className="min-w-8 rounded-lg" variant="default">
            {selectedCount}
          </Badge>
          <span className="hidden sm:inline">{selectionLabel(selectedCount)}</span>
        </div>
        <div className="h-5 w-px bg-border" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
