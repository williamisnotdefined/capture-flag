import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
import { Badge } from "@components/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/Dialog";
import { ColumnHeader, Table, useTable } from "@components/table";
import { formatDateTime } from "@core/date/formatDateTime";
import { formatJson } from "@core/json/formatJson";
import { isNonEmptyRecord } from "@core/json/isNonEmptyRecord";
import type { AuditLog } from "@src/types";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { formatAuditAction, formatAuditActor } from "./AuditTimeline";

type AuditLogsTableProps = {
  emptyMessage: string;
  entries: AuditLog[];
  isFetching: boolean;
};

export function AuditLogsTable({ emptyMessage, entries, isFetching }: AuditLogsTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditLog | null>(null);
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorFn: (entry) => formatAuditAction(entry.action),
      cell: ({ row }) => (
        <Badge variant="secondary">{formatAuditAction(row.original.action)}</Badge>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Action" />,
      id: "action",
      meta: { tdClassName: "min-w-48" },
    },
    {
      accessorFn: (entry) => `${entry.entityType} ${entry.entityId}`,
      cell: ({ row }) => (
        <div>
          <strong className="block text-foreground">{row.original.entityType}</strong>
          <span className="block break-all font-mono text-xs text-muted-foreground">
            {row.original.entityId}
          </span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Entity" />,
      id: "entity",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorFn: formatAuditActor,
      cell: ({ row }) => formatAuditActor(row.original),
      header: ({ column }) => <ColumnHeader column={column} title="Actor" />,
      id: "actor",
      meta: { tdClassName: "min-w-56 whitespace-normal text-muted-foreground" },
    },
    {
      accessorKey: "createdAt",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      header: ({ column }) => <ColumnHeader column={column} title="Created at" />,
      meta: { tdClassName: "min-w-40 text-muted-foreground" },
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${formatAuditAction(row.original.action)}`}>
          <ActionMenuItem onClick={() => setSelectedEntry(row.original)}>
            Ver detalhes
          </ActionMenuItem>
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: entries,
    enablePagination: false,
    getRowId: (entry) => entry.id,
  });

  return (
    <>
      <Table emptyMessage={isFetching ? "Carregando audit logs..." : emptyMessage} table={table} />

      <Dialog
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          {selectedEntry ? <AuditLogDetails entry={selectedEntry} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuditLogDetails({ entry }: { entry: AuditLog }) {
  const metadata = isNonEmptyRecord(entry.metadata) ? entry.metadata : null;
  const hasDetails = entry.oldValue !== null || entry.newValue !== null || metadata;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{formatAuditAction(entry.action)}</DialogTitle>
        <DialogDescription>
          {formatAuditActor(entry)} em {entry.entityType} em {formatDateTime(entry.createdAt)}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase">Entity</span>
            <p className="mt-1 font-medium text-foreground">{entry.entityType}</p>
            <p className="break-all font-mono text-xs text-muted-foreground">{entry.entityId}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase">Actor</span>
            <p className="mt-1 text-muted-foreground">{formatAuditActor(entry)}</p>
          </div>
        </div>
        {hasDetails ? (
          <div className="grid gap-2">
            {entry.oldValue !== null ? (
              <AuditJsonBlock label="Old value" value={entry.oldValue} />
            ) : null}
            {entry.newValue !== null ? (
              <AuditJsonBlock label="New value" value={entry.newValue} />
            ) : null}
            {metadata ? <AuditJsonBlock label="Metadata" value={metadata} /> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este evento nao possui detalhes adicionais.
          </p>
        )}
      </div>
    </>
  );
}

function AuditJsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="rounded-md border border-border bg-muted p-3 text-foreground">
      <summary className="cursor-pointer text-xs font-medium tracking-[0.08em] uppercase">
        {label}
      </summary>
      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">
        {formatJson(value)}
      </pre>
    </details>
  );
}
