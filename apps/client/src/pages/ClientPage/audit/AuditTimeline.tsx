import cls from "classnames";
import { ErrorMessage, Eyebrow } from "../../../components";
import type { AuditLog } from "../../../types";

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
        {description ? <p className="text-sm text-stone-600">{description}</p> : null}
      </div>
      <ErrorMessage error={error} />
      {entries.length === 0 && !isFetching ? (
        <p className="text-sm text-stone-600">{emptyMessage}</p>
      ) : null}
      <div className="grid gap-2">
        {entries.map((entry) => (
          <article className="rounded-xl bg-white/70 p-3 text-sm" key={entry.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-slate-900">{formatAuditAction(entry.action)}</strong>
              <span className="text-xs text-stone-600">{formatDateTime(entry.createdAt)}</span>
            </div>
            <p className="text-stone-700">
              {entry.actor?.name ?? "Sistema"} em {entry.entityType}
            </p>
            <p className="break-all font-mono text-xs text-stone-500">{entry.entityId}</p>
            <AuditValueDetails entry={entry} />
          </article>
        ))}
      </div>
      {isFetching ? <p className="text-sm text-stone-600">Atualizando audit logs...</p> : null}
    </section>
  );
}

function AuditValueDetails({ entry }: { entry: AuditLog }) {
  const metadata = isNonEmptyObject(entry.metadata) ? entry.metadata : null;

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
    <details className="rounded-lg bg-slate-950/95 p-2 text-slate-100">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.08em]">
        {label}
      </summary>
      <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs">
        {formatAuditJson(value)}
      </pre>
    </details>
  );
}

function isNonEmptyObject(value: unknown) {
  return Boolean(
    value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0,
  );
}

export function formatAuditAction(action: string) {
  return action.replace(/_/g, " ").replace(/\./g, " / ");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAuditJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
