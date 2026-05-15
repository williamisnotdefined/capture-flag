import { type FormEvent, useState } from "react";
import { useGetAuditLogs } from "../../../api/auditLogs";
import { Button, Panel, PermissionHint, TextInput } from "../../../components";
import type { AuditLogFilters } from "../../../types";
import { AuditTimeline } from "./AuditTimeline";

type AuditLogFilterFormValues = {
  action: string;
  actorUserId: string;
  entityId: string;
  entityType: string;
  from: string;
  to: string;
};

type AuditLogsPanelProps = {
  canViewOrganizationAudit: boolean;
  organizationId: string;
  projectId: string;
};

const emptyFilters: AuditLogFilterFormValues = {
  action: "",
  actorUserId: "",
  entityId: "",
  entityType: "",
  from: "",
  to: "",
};

export function AuditLogsPanel({
  canViewOrganizationAudit,
  organizationId,
  projectId,
}: AuditLogsPanelProps) {
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const filters = toAuditLogFilters(appliedFilters, projectId);
  const canQueryAudit = Boolean(organizationId && (projectId || canViewOrganizationAudit));
  const auditLogsQuery = useGetAuditLogs({
    enabled: canQueryAudit,
    filters,
    organizationId,
  });

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  return (
    <Panel title="Audit Logs" wide>
      <form className="grid gap-3 lg:grid-cols-3" noValidate onSubmit={applyFilters}>
        <TextInput
          aria-label="Filtrar por actor user id"
          onChange={(event) => setDraftFilter("actorUserId", event.target.value, setDraftFilters)}
          placeholder="Actor user id"
          value={draftFilters.actorUserId}
        />
        <TextInput
          aria-label="Filtrar por action"
          onChange={(event) => setDraftFilter("action", event.target.value, setDraftFilters)}
          placeholder="Action, ex: flag.updated"
          value={draftFilters.action}
        />
        <TextInput
          aria-label="Filtrar por entity type"
          onChange={(event) => setDraftFilter("entityType", event.target.value, setDraftFilters)}
          placeholder="Entity type"
          value={draftFilters.entityType}
        />
        <TextInput
          aria-label="Filtrar por entity id"
          onChange={(event) => setDraftFilter("entityId", event.target.value, setDraftFilters)}
          placeholder="Entity id"
          value={draftFilters.entityId}
        />
        <TextInput
          aria-label="Filtrar a partir de"
          onChange={(event) => setDraftFilter("from", event.target.value, setDraftFilters)}
          type="datetime-local"
          value={draftFilters.from}
        />
        <TextInput
          aria-label="Filtrar ate"
          onChange={(event) => setDraftFilter("to", event.target.value, setDraftFilters)}
          type="datetime-local"
          value={draftFilters.to}
        />
        <div className="flex flex-wrap gap-2 lg:col-span-3">
          <Button disabled={!canQueryAudit} type="submit" variant="secondary">
            Aplicar filtros
          </Button>
          <Button
            disabled={!canQueryAudit}
            onClick={clearFilters}
            type="button"
            variant="secondary"
          >
            Limpar filtros
          </Button>
        </div>
      </form>
      {!canQueryAudit ? (
        <PermissionHint>
          Selecione um projeto ou use uma organizacao onde voce seja owner/admin para ver audit
          logs.
        </PermissionHint>
      ) : null}
      <AuditTimeline
        className="mt-5 border-t border-stone-300 pt-4"
        description={
          projectId
            ? "Eventos recentes do projeto selecionado."
            : "Eventos recentes da organizacao."
        }
        emptyMessage="Nenhum audit log encontrado para os filtros atuais."
        entries={auditLogsQuery.data?.items ?? []}
        error={auditLogsQuery.error}
        isFetching={auditLogsQuery.isFetching}
        title="Timeline"
      />
    </Panel>
  );
}

function setDraftFilter(
  key: keyof AuditLogFilterFormValues,
  value: string,
  setDraftFilters: (
    updater: (filters: AuditLogFilterFormValues) => AuditLogFilterFormValues,
  ) => void,
) {
  setDraftFilters((filters) => ({ ...filters, [key]: value }));
}

function toAuditLogFilters(values: AuditLogFilterFormValues, projectId: string): AuditLogFilters {
  return {
    limit: 50,
    ...(projectId ? { projectId } : {}),
    ...(values.action.trim() ? { action: values.action.trim() } : {}),
    ...(values.actorUserId.trim() ? { actorUserId: values.actorUserId.trim() } : {}),
    ...(values.entityId.trim() ? { entityId: values.entityId.trim() } : {}),
    ...(values.entityType.trim() ? { entityType: values.entityType.trim() } : {}),
    ...(values.from ? { from: new Date(values.from).toISOString() } : {}),
    ...(values.to ? { to: new Date(values.to).toISOString() } : {}),
  };
}
