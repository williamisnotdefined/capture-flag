import { useGetAuditLogs } from "@api/auditLogs";
import { useGetProjectConfigs } from "@api/configs";
import { Button } from "@components/Button";
import { FilterSelect, SearchField } from "@components/DataToolbar";
import { ErrorMessage } from "@components/ErrorMessage";
import { TextInput } from "@components/FormControls";
import { Panel } from "@components/Panel";
import { PermissionHint } from "@components/PermissionHint";
import { toDate } from "@core/date/toDate";
import { toIsoDateTime } from "@core/date/toIsoDateTime";
import { useProjectRouteContext } from "@routing/useRouteContext";
import { canManageOrganizationMembers } from "@src/permissions";
import type { AuditLogFilters } from "@src/types";
import { type FormEvent, useState } from "react";
import { AuditLogsTable } from "./AuditLogsTable";

type AuditLogFilterFormValues = {
  action: string;
  actorUserId: string;
  configId: string;
  entityId: string;
  entityType: string;
  from: string;
  to: string;
};

const emptyFilters: AuditLogFilterFormValues = {
  action: "",
  actorUserId: "",
  configId: "",
  entityId: "",
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
  const configsQuery = useGetProjectConfigs(projectId);
  const canQueryAudit = Boolean(
    organizationId && (auditScope === "organization" ? canViewOrganizationAudit : scopedProjectId),
  );
  const auditLogsQuery = useGetAuditLogs({
    enabled: canQueryAudit,
    filters,
    organizationId,
  });
  const auditLogEntries = auditLogsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const actorOptions = auditLogActorOptions(auditLogEntries);
  const configOptions = configsQuery.data ?? [];
  const entityOptions = auditLogEntityOptions(auditLogEntries);

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
            <FilterSelect
              aria-label="Filtrar por actor"
              disabled={actorOptions.length === 0}
              label="Actor"
              onChange={(event) =>
                setDraftFilter("actorUserId", event.target.value, setDraftFilters)
              }
              value={draftFilters.actorUserId}
              valueLabel={selectedActorLabel(actorOptions, draftFilters.actorUserId)}
            >
              <option value="">Todos os actors</option>
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </FilterSelect>
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
            <FilterSelect
              aria-label="Filtrar por config"
              disabled={configOptions.length === 0}
              label="Config"
              onChange={(event) => setDraftFilter("configId", event.target.value, setDraftFilters)}
              value={draftFilters.configId}
              valueLabel={selectedConfigLabel(configOptions, draftFilters.configId)}
            >
              <option value="">Todas as configs</option>
              {configOptions.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </FilterSelect>
            <TextInput
              aria-label="Filtrar por entity type"
              className="h-8 w-full sm:w-40"
              onChange={(event) =>
                setDraftFilter("entityType", event.target.value, setDraftFilters)
              }
              placeholder="Entity type"
              value={draftFilters.entityType}
            />
            <FilterSelect
              aria-label="Filtrar por entidade"
              disabled={entityOptions.length === 0}
              label="Entity"
              onChange={(event) => setDraftFilter("entityId", event.target.value, setDraftFilters)}
              value={draftFilters.entityId}
              valueLabel={selectedEntityLabel(entityOptions, draftFilters.entityId)}
            >
              <option value="">Todas as entidades</option>
              {entityOptions.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.label}
                </option>
              ))}
            </FilterSelect>
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
        <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
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
      <ErrorMessage error={configsQuery.error} />
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
    ...(values.actorUserId ? { actorUserId: values.actorUserId } : {}),
    ...(values.configId ? { configId: values.configId } : {}),
    ...(values.entityId ? { entityId: values.entityId } : {}),
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

function selectedActorLabel(actors: AuditLogActorOption[], actorUserId: string) {
  return actors.find((actor) => actor.id === actorUserId)?.label;
}

function selectedConfigLabel(configs: Array<{ id: string; name: string }>, configId: string) {
  return configs.find((config) => config.id === configId)?.name;
}

function selectedEntityLabel(entities: AuditLogEntityOption[], entityId: string) {
  return entities.find((entity) => entity.id === entityId)?.label;
}

type AuditLogEntityOption = {
  id: string;
  label: string;
};

type AuditLogActorOption = {
  id: string;
  label: string;
};

function auditLogActorOptions(
  entries: Array<{ actor: { name: string } | null; actorUserId: string | null }>,
) {
  const options = new Map<string, AuditLogActorOption>();

  for (const entry of entries) {
    if (entry.actorUserId && !options.has(entry.actorUserId)) {
      options.set(entry.actorUserId, {
        id: entry.actorUserId,
        label: entry.actor?.name ?? `Usuario removido (${entry.actorUserId})`,
      });
    }
  }

  return Array.from(options.values());
}

function auditLogEntityOptions(entries: Array<{ entityId: string; entityType: string }>) {
  const options = new Map<string, AuditLogEntityOption>();

  for (const entry of entries) {
    if (!options.has(entry.entityId)) {
      options.set(entry.entityId, {
        id: entry.entityId,
        label: `${entry.entityType} ${entry.entityId}`,
      });
    }
  }

  return Array.from(options.values());
}
