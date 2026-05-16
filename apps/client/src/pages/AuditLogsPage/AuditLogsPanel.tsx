import { type FormEvent, useState } from "react";
import { useGetAuditLogs } from "../../api/auditLogs";
import {
  Button,
  ErrorMessage,
  FilterSelect,
  Panel,
  PermissionHint,
  SearchField,
  TextInput,
} from "../../components";
import { toDate } from "../../core/date/toDate";
import { toIsoDateTime } from "../../core/date/toIsoDateTime";
import { canManageOrganizationMembers } from "../../permissions";
import { useProjectRouteContext } from "../../routing/useRouteContext";
import type { AuditLogFilters } from "../../types";
import { AuditLogsTable } from "./AuditLogsTable";

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
  const scopedProjectId = auditScope === "project" && projectId ? projectId : "";
  const filters = toAuditLogFilters(appliedFilters, scopedProjectId);
  const canQueryAudit = Boolean(
    organizationId && (auditScope === "organization" ? canViewOrganizationAudit : scopedProjectId),
  );
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

  function updateAuditScope(value: string) {
    const nextScope = value === "organization" ? "organization" : "project";
    setAuditScope(nextScope);
  }

  return (
    <Panel showTitle={false} title="Audit Logs" wide>
      <form className="grid gap-3" noValidate onSubmit={applyFilters}>
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchField
              aria-label="Filtrar por action"
              className="sm:w-64"
              onChange={(event) => setDraftFilter("action", event.target.value, setDraftFilters)}
              placeholder="Filter by action..."
              value={draftFilters.action}
            />
            {canViewOrganizationAudit ? (
              <FilterSelect
                aria-label="Selecionar escopo dos audit logs"
                className="w-full sm:w-auto"
                label="Scope"
                onChange={(event) => updateAuditScope(event.target.value)}
                value={auditScope}
                valueLabel={formatAuditScope(auditScope)}
              >
                <option disabled={!projectId} value="project">
                  Projeto selecionado
                </option>
                <option value="organization">Organizacao inteira</option>
              </FilterSelect>
            ) : null}
            <TextInput
              aria-label="Filtrar por entity type"
              className="h-8 w-full sm:w-40"
              onChange={(event) =>
                setDraftFilter("entityType", event.target.value, setDraftFilters)
              }
              placeholder="Entity type"
              value={draftFilters.entityType}
            />
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
              <TextInput
                aria-label="Filtrar a partir de"
                className="h-8 w-full text-sm sm:w-[11.5rem]"
                onChange={(event) => setDraftFilter("from", event.target.value, setDraftFilters)}
                type="datetime-local"
                value={draftFilters.from}
              />
              <TextInput
                aria-label="Filtrar ate"
                className="h-8 w-full text-sm sm:w-[11.5rem]"
                onChange={(event) => setDraftFilter("to", event.target.value, setDraftFilters)}
                type="datetime-local"
                value={draftFilters.to}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
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
        </div>
      </form>
      {filterError ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {filterError}
        </p>
      ) : null}
      {!canQueryAudit ? (
        <PermissionHint>
          Selecione um projeto ou use uma organizacao onde voce seja owner/admin para ver audit
          logs.
        </PermissionHint>
      ) : null}
      <ErrorMessage error={auditLogsQuery.error} />
      <AuditLogsTable
        emptyMessage="Nenhum audit log encontrado para os filtros atuais."
        entries={auditLogEntries}
        isFetching={auditLogsQuery.isFetching}
      />
      <div className="flex items-center justify-between gap-4 px-2 max-sm:flex-col max-sm:items-start">
        <p className="text-sm text-muted-foreground">{auditLogEntries.length} eventos carregados</p>
        {auditLogsQuery.hasNextPage ? (
          <Button
            disabled={!canQueryAudit || auditLogsQuery.isFetchingNextPage}
            onClick={() => void auditLogsQuery.fetchNextPage()}
            type="button"
            variant="secondary"
          >
            {auditLogsQuery.isFetchingNextPage ? "Carregando mais..." : "Carregar mais"}
          </Button>
        ) : null}
      </div>
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

function formatAuditScope(scope: "organization" | "project") {
  return scope === "organization" ? "Organizacao inteira" : "Projeto selecionado";
}
