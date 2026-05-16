import { ActionMenu, ActionMenuItem } from "@components/ActionMenu";
import { Badge } from "@components/Badge";
import { DataTablePagination } from "@components/DataTablePagination";
import { DataToolbar, FilterSelect, SearchField } from "@components/DataToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/Table";
import { formatDateTime } from "@core/date/formatDateTime";
import type { SdkKey } from "@src/types";
import cls from "classnames";
import { useDeferredValue, useState } from "react";

type SdkKeyListProps = {
  canManageProjectResources: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onRevoke: (sdkKeyId: string) => void;
  onRotate: (sdkKeyId: string) => void;
  sdkKeys: SdkKey[];
};

export function SdkKeyList({
  canManageProjectResources,
  isFetching,
  isMutating,
  onRevoke,
  onRotate,
  sdkKeys,
}: SdkKeyListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [configFilter, setConfigFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const configOptions = uniqueOptions(
    sdkKeys.map((sdkKey) => ({ id: sdkKey.config.id, name: sdkKey.config.name })),
  );
  const environmentOptions = uniqueOptions(
    sdkKeys.map((sdkKey) => ({ id: sdkKey.environment.id, name: sdkKey.environment.name })),
  );
  const visibleSdkKeys = sdkKeys.filter((sdkKey) => {
    const status = sdkKey.revokedAt ? "revoked" : "active";

    if (statusFilter !== "all" && statusFilter !== status) {
      return false;
    }

    if (configFilter !== "all" && configFilter !== sdkKey.config.id) {
      return false;
    }

    if (environmentFilter !== "all" && environmentFilter !== sdkKey.environment.id) {
      return false;
    }

    if (!deferredSearchInput) {
      return true;
    }

    const haystack = [
      sdkKey.name,
      sdkKey.keyPrefix,
      sdkKey.config.name,
      sdkKey.environment.name,
      sdkKey.revokedAt ? "revogada" : "ativa",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(deferredSearchInput);
  });
  const pageCount = Math.max(1, Math.ceil(visibleSdkKeys.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedSdkKeys = visibleSdkKeys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar SDK keys"
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by key, config or environment..."
          value={searchInput}
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            aria-label="Filtrar SDK keys por status"
            label="Status"
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            value={statusFilter}
            valueLabel={statusFilter === "all" ? undefined : formatStatusFilter(statusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="revoked">Revogadas</option>
          </FilterSelect>
          <FilterSelect
            aria-label="Filtrar SDK keys por config"
            label="Config"
            onChange={(event) => {
              setConfigFilter(event.target.value);
              setPage(1);
            }}
            value={configFilter}
            valueLabel={optionLabel(configOptions, configFilter)}
          >
            <option value="all">Todas as configs</option>
            {configOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            aria-label="Filtrar SDK keys por environment"
            label="Environment"
            onChange={(event) => {
              setEnvironmentFilter(event.target.value);
              setPage(1);
            }}
            value={environmentFilter}
            valueLabel={optionLabel(environmentOptions, environmentFilter)}
          >
            <option value="all">Todos os environments</option>
            {environmentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FilterSelect>
        </div>
      </DataToolbar>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SDK Key</TableHead>
              <TableHead>Config / ambiente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ultimo uso</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSdkKeys.length > 0 ? (
              paginatedSdkKeys.map((sdkKey) => (
                <TableRow className="text-foreground" key={sdkKey.id}>
                  <TableCell className="min-w-48">
                    <strong className="block text-foreground">{sdkKey.name}</strong>
                    <span className="font-mono text-xs text-muted-foreground">
                      {sdkKey.keyPrefix}...
                    </span>
                  </TableCell>
                  <TableCell className="min-w-48">
                    {sdkKey.config.name} / {sdkKey.environment.name}
                  </TableCell>
                  <TableCell>
                    <div className="grid gap-1">
                      <Badge
                        className={cls({
                          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300":
                            !sdkKey.revokedAt,
                          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300":
                            sdkKey.revokedAt,
                        })}
                        variant="outline"
                      >
                        {sdkKey.revokedAt ? "revogada" : "ativa"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Criada {formatDateTime(sdkKey.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sdkKey.lastUsedAt ? formatDateTime(sdkKey.lastUsedAt) : "nunca"}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu label={`Acoes para ${sdkKey.name}`}>
                      <ActionMenuItem
                        disabled={
                          !canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)
                        }
                        onClick={() => onRotate(sdkKey.id)}
                      >
                        Rotacionar
                      </ActionMenuItem>
                      <ActionMenuItem
                        destructive
                        disabled={
                          !canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)
                        }
                        onClick={() => onRevoke(sdkKey.id)}
                      >
                        Revogar
                      </ActionMenuItem>
                    </ActionMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                  {sdkKeys.length === 0 && !isFetching
                    ? "Sem SDK keys."
                    : "Nenhuma SDK key encontrada."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        page={currentPage}
        pageSize={pageSize}
        totalItems={visibleSdkKeys.length}
      />
      {isFetching ? <p className="text-sm text-muted-foreground">Atualizando SDK keys...</p> : null}
    </div>
  );
}

function uniqueOptions(options: Array<{ id: string; name: string }>) {
  return Array.from(new Map(options.map((option) => [option.id, option])).values()).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
}

function optionLabel(options: Array<{ id: string; name: string }>, value: string) {
  if (value === "all") {
    return undefined;
  }

  return options.find((option) => option.id === value)?.name;
}

function formatStatusFilter(value: string) {
  if (value === "active") {
    return "Ativas";
  }

  if (value === "revoked") {
    return "Revogadas";
  }

  return undefined;
}
