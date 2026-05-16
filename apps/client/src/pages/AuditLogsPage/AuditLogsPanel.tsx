import { type FormEvent, useState } from "react";
import { useGetAuditLogs } from "../../api/auditLogs";
import { Button, Panel, PermissionHint, TextInput } from "../../components";
import { toDate } from "../../core/date/toDate";
import { toIsoDateTime } from "../../core/date/toIsoDateTime";
import { useProjectRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageOrganizationMembers } from "../../permissions";
import type { AuditLogFilters } from "../../types";
import { AuditTimeline } from "./AuditTimeline";

type AuditLogFilterFormValues = {
  action: string;
  entityType: string;
  from: string;
  to: string;
};

const emptyFilters: AuditLogFilterFormValues = {
  action: "",
  entityType: "",
  from: "",
  to: "",
};

export function AuditLogsPanel() {
  const {
    organizationRole,
    selectedOrganizationId: organizationId,
    selectedProjectId: projectId,
  } = useProjectRouteContext();
  const canViewOrganizationAudit = canManageOrganizationMembers(organizationRole);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [auditScope, setAuditScope] = useState<"organization" | "project">("project");
  const [filterError, setFilterError] = useState<string | null>(null);
  const scopedProjectId = auditScope === "project" ? projectId : "";
  const filters = toAuditLogFilters(appliedFilters, scopedProjectId);
  const canQueryAudit = Boolean(organizationId && (scopedProjectId || canViewOrganizationAudit));
  const auditLogsQuery = useGetAuditLogs({
    enabled: canQueryAudit,
    filters,
    organizationId,
  });
  const auditLogEntries = auditLogsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilterError = validateDateFilters(draftFilters);
    if (nextFilterError) {
      setFilterError(nextFilterError);
      return;
    }

    setFilterError(null);
    setAppliedFilters(draftFilters);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError(null);
  }

  return (
    <Panel showTitle={false} title="Audit Logs" wide>
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" noValidate onSubmit={applyFilters}>
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
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
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
      {filterError ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {filterError}
        </p>
      ) : null}
      {canViewOrganizationAudit ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-slate-900">Escopo:</span>
          <Button
            disabled={!projectId}
            onClick={() => setAuditScope("project")}
            type="button"
            variant={auditScope === "project" ? "primary" : "secondary"}
          >
            Projeto selecionado
          </Button>
          <Button
            onClick={() => setAuditScope("organization")}
            type="button"
            variant={auditScope === "organization" ? "primary" : "secondary"}
          >
            Organizacao inteira
          </Button>
        </div>
      ) : null}
      {!canQueryAudit ? (
        <PermissionHint>
          Selecione um projeto ou use uma organizacao onde voce seja owner/admin para ver audit
          logs.
        </PermissionHint>
      ) : null}
      <AuditTimeline
        className="mt-5 border-t border-border pt-4"
        description={
          scopedProjectId
            ? "Eventos recentes do projeto selecionado."
            : "Eventos recentes da organizacao."
        }
        emptyMessage="Nenhum audit log encontrado para os filtros atuais."
        entries={auditLogEntries}
        error={auditLogsQuery.error}
        isFetching={auditLogsQuery.isFetching}
        title="Timeline"
      />
      {auditLogsQuery.hasNextPage ? (
        <Button
          className="mt-4"
          disabled={!canQueryAudit || auditLogsQuery.isFetchingNextPage}
          onClick={() => void auditLogsQuery.fetchNextPage()}
          type="button"
          variant="secondary"
        >
          {auditLogsQuery.isFetchingNextPage ? "Carregando mais..." : "Carregar mais"}
        </Button>
      ) : null}
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
  const from = toIsoDateTime(values.from);
  const to = toIsoDateTime(values.to);

  return {
    limit: 50,
    ...(projectId ? { projectId } : {}),
    ...(values.action.trim() ? { action: values.action.trim() } : {}),
    ...(values.entityType.trim() ? { entityType: values.entityType.trim() } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function validateDateFilters(values: AuditLogFilterFormValues) {
  const from = toDate(values.from);
  const to = toDate(values.to);

  if (values.from && !from) {
    return "Data inicial invalida.";
  }

  if (values.to && !to) {
    return "Data final invalida.";
  }

  if (from && to && from > to) {
    return "A data inicial precisa ser anterior a data final.";
  }

  return null;
}
