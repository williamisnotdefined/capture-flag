import { useState } from "react";
import {
  ActionMenu,
  ActionMenuItem,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components";
import { formatDateTime } from "../../core/date/formatDateTime";
import { formatJson } from "../../core/json/formatJson";
import { isNonEmptyRecord } from "../../core/json/isNonEmptyRecord";
import type { AuditLog } from "../../types";
import { formatAuditAction, formatAuditActor } from "./AuditTimeline";

type AuditLogsTableProps = {
  emptyMessage: string;
  entries: AuditLog[];
  isFetching: boolean;
};

export function AuditLogsTable({ emptyMessage, entries, isFetching }: AuditLogsTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditLog | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="min-w-48">
                    <Badge variant="secondary">{formatAuditAction(entry.action)}</Badge>
                  </TableCell>
                  <TableCell className="min-w-52">
                    <strong className="block text-foreground">{entry.entityType}</strong>
                    <span className="block break-all font-mono text-xs text-muted-foreground">
                      {entry.entityId}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal text-muted-foreground">
                    {formatAuditActor(entry)}
                  </TableCell>
                  <TableCell className="min-w-40 text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu label={`Acoes para ${formatAuditAction(entry.action)}`}>
                      <ActionMenuItem onClick={() => setSelectedEntry(entry)}>
                        Ver detalhes
                      </ActionMenuItem>
                    </ActionMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                  {isFetching ? "Carregando audit logs..." : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
    <details className="rounded-md bg-slate-950/95 p-3 text-slate-100">
      <summary className="cursor-pointer text-xs font-medium tracking-[0.08em] uppercase">
        {label}
      </summary>
      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">
        {formatJson(value)}
      </pre>
    </details>
  );
}
