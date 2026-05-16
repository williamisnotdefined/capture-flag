import cls from "classnames";
import { ErrorMessage, Eyebrow } from "../../components";
import { formatDateTime } from "../../core/date/formatDateTime";
import { formatJson } from "../../core/json/formatJson";
import { isNonEmptyRecord } from "../../core/json/isNonEmptyRecord";
import type { AuditLog } from "../../types";

type AuditTimelineProps = {
  description?: string;
  emptyMessage: string;
  entries: AuditLog[];
  error: unknown;
  isFetching: boolean;
  title: string;
  className?: string;
};

export function AuditTimeline({
  className,
  description,
  emptyMessage,
  entries,
  error,
  isFetching,
  title,
}: AuditTimelineProps) {
  return (
    <section className={cls("grid gap-3", className)}>
      <div>
        <Eyebrow>{title}</Eyebrow>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <ErrorMessage error={error} />
      {entries.length === 0 && !isFetching ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}
      <div className="grid gap-2">
        {entries.map((entry) => (
          <article
            className="rounded-md border border-border bg-background p-3 text-sm"
            key={entry.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-foreground">{formatAuditAction(entry.action)}</strong>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt)}
              </span>
            </div>
            <p className="text-muted-foreground">
              {formatAuditActor(entry)} em {entry.entityType}
            </p>
            <p className="break-all font-mono text-xs text-muted-foreground">{entry.entityId}</p>
            <AuditValueDetails entry={entry} />
          </article>
        ))}
      </div>
      {isFetching ? (
        <p className="text-sm text-muted-foreground">Atualizando audit logs...</p>
      ) : null}
    </section>
  );
}

function AuditValueDetails({ entry }: { entry: AuditLog }) {
  const metadata = isNonEmptyRecord(entry.metadata) ? entry.metadata : null;

  if (entry.oldValue === null && entry.newValue === null && !metadata) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {entry.oldValue !== null ? <AuditJsonBlock label="Old value" value={entry.oldValue} /> : null}
      {entry.newValue !== null ? <AuditJsonBlock label="New value" value={entry.newValue} /> : null}
      {metadata ? <AuditJsonBlock label="Metadata" value={metadata} /> : null}
    </div>
  );
}

function AuditJsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="rounded-md bg-slate-950/95 p-2 text-slate-100">
      <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.08em]">
        {label}
      </summary>
      <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs">
        {formatJson(value)}
      </pre>
    </details>
  );
}

export function formatAuditAction(action: string) {
  return action.replace(/_/g, " ").replace(/\./g, " / ");
}

export function formatAuditActor(entry: AuditLog) {
  if (entry.actor) {
    const displayName = entry.actor.name || entry.actor.email || entry.actor.id;
    const detail =
      entry.actor.email && entry.actor.email !== displayName ? entry.actor.email : entry.actor.id;

    return `${displayName} (${detail})`;
  }

  if (entry.actorUserId) {
    return `Usuario removido (${entry.actorUserId})`;
  }

  return "Sistema";
}
