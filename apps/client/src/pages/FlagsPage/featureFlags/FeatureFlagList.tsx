import cls from "classnames";
import { useState } from "react";
import {
  ActionMenu,
  ActionMenuItem,
  Badge,
  ClickableTableRow,
  DataTablePagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components";
import type { FeatureFlag } from "../../../types";
import { featureFlagStateLabels, getFeatureFlagOperationalState } from "./utils";

type FeatureFlagListProps = {
  canManageFeatureFlags: boolean;
  environmentId: string;
  flags: FeatureFlag[];
  isDeleting: boolean;
  isFetching: boolean;
  onDelete: (featureFlagId: string) => void;
  onSelect: (featureFlagId: string) => void;
  selectedFeatureFlagId: string;
};

export function FeatureFlagList({
  canManageFeatureFlags,
  environmentId,
  flags,
  isDeleting,
  isFetching,
  onDelete,
  onSelect,
  selectedFeatureFlagId,
}: FeatureFlagListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(flags.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedFlags = flags.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="grid gap-3 self-start">
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlags.length > 0 ? (
              paginatedFlags.map((flag) => {
                const state = environmentId
                  ? getFeatureFlagOperationalState(flag, environmentId)
                  : "missing";
                const isSelected = flag.id === selectedFeatureFlagId;

                return (
                  <ClickableTableRow
                    aria-label={`Editar ${flag.name}`}
                    data-state={isSelected ? "selected" : undefined}
                    key={flag.id}
                    onActivate={() => onSelect(flag.id)}
                  >
                    <TableCell className="min-w-72 max-w-0 whitespace-normal">
                      <div className="grid gap-1 text-left">
                        <strong className="block text-foreground">{flag.name}</strong>
                        <span className="block break-all font-mono text-xs text-muted-foreground">
                          {flag.key}
                        </span>
                        {flag.tags.length > 0 ? (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {flag.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cls({
                          "border-amber-200 bg-amber-50 text-amber-800": state === "missing",
                          "border-emerald-200 bg-emerald-50 text-emerald-800": state === "default",
                          "border-indigo-200 bg-indigo-50 text-indigo-800": state === "rules",
                          "border-orange-200 bg-orange-50 text-orange-800": state === "rollout",
                        })}
                        variant="outline"
                      >
                        {featureFlagStateLabels[state]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionMenu label={`Acoes para ${flag.name}`}>
                        <ActionMenuItem onClick={() => onSelect(flag.id)}>Editar</ActionMenuItem>
                        <ActionMenuItem
                          destructive
                          disabled={!canManageFeatureFlags || isDeleting}
                          onClick={() => onDelete(flag.id)}
                        >
                          Apagar
                        </ActionMenuItem>
                      </ActionMenu>
                    </TableCell>
                  </ClickableTableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
                  Nenhuma flag encontrada nesta config.
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
        totalItems={flags.length}
      />
      {isFetching ? <p className="text-sm text-muted-foreground">Atualizando flags...</p> : null}
    </div>
  );
}
