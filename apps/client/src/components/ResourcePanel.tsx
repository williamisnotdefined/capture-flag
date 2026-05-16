import { useDeferredValue, useState } from "react";
import { formatResourceLabel } from "../core/strings/formatResourceLabel";
import { ActionMenu, ActionMenuItem } from "./ActionMenu";
import { Badge } from "./Badge";
import { DataTablePagination } from "./DataTablePagination";
import { DataToolbar, SearchField } from "./DataToolbar";
import { ErrorMessage } from "./ErrorMessage";
import { InlineNameEditor } from "./InlineNameEditor";
import { Panel } from "./Panel";
import { PermissionHint } from "./PermissionHint";
import {
  ClickableTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

type ResourcePanelProps<TResource extends { id: string; key: string; name: string }> = {
  canEditName?: boolean;
  emptyMessage: string;
  getDescription?: (item: TResource) => string | null | undefined;
  items: TResource[];
  mutationError?: unknown;
  nameEditDisabled?: boolean;
  onRename?: (item: TResource, name: string) => Promise<unknown> | unknown;
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  selectedId: string;
  title: string;
};

export function ResourcePanel<TResource extends { id: string; key: string; name: string }>({
  canEditName = false,
  emptyMessage,
  getDescription,
  items,
  mutationError,
  nameEditDisabled = false,
  onRename,
  onSelect,
  permissionHint,
  queryError,
  selectedId,
  title,
}: ResourcePanelProps<TResource>) {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const visibleItems = items.filter((item) => {
    if (!deferredSearchInput) {
      return true;
    }

    return [item.name, item.key, formatResourceLabel(item), getDescription?.(item) ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(deferredSearchInput);
  });
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Panel showTitle={false} title={title}>
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={mutationError} />
      <DataToolbar>
        <SearchField
          aria-label={`Filtrar ${title}`}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by name or key..."
          value={searchInput}
        />
      </DataToolbar>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{title}</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const description = getDescription?.(item);

                return (
                  <ClickableTableRow
                    aria-label={`Selecionar ${item.name}`}
                    data-state={selectedId === item.id ? "selected" : undefined}
                    key={item.id}
                    onActivate={() => onSelect(item.id)}
                  >
                    <TableCell className="min-w-52">
                      {onRename ? (
                        <InlineNameEditor
                          canEdit={canEditName}
                          disabled={nameEditDisabled}
                          displayClassName="block truncate text-foreground"
                          editLabel={`Editar ${item.name}`}
                          inputClassName="sm:w-64"
                          name={item.name}
                          onSubmit={(name) => onRename(item, name)}
                        />
                      ) : (
                        <strong className="block text-foreground">{item.name}</strong>
                      )}
                      <span className="block text-xs text-muted-foreground">
                        {formatResourceLabel(item)}
                      </span>
                      {description ? (
                        <span className="mt-1 block max-w-xl truncate text-xs text-muted-foreground">
                          {description}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.key}
                    </TableCell>
                    <TableCell>
                      {selectedId === item.id ? (
                        <Badge variant="secondary">Selecionado</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionMenu label={`Acoes para ${item.name}`}>
                        <ActionMenuItem
                          disabled={selectedId === item.id}
                          onClick={() => onSelect(item.id)}
                        >
                          Selecionar
                        </ActionMenuItem>
                      </ActionMenu>
                    </TableCell>
                  </ClickableTableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
                  {items.length === 0 ? emptyMessage : `Nenhum item encontrado em ${title}.`}
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
        totalItems={visibleItems.length}
      />
    </Panel>
  );
}
