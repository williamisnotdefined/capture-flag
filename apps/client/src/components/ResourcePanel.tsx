import { useDeferredValue, useState } from "react";
import { formatResourceLabel } from "../core/strings/formatResourceLabel";
import { ActionMenu, ActionMenuItem } from "./ActionMenu";
import { Badge } from "./Badge";
import { DataTablePagination } from "./DataTablePagination";
import { DataToolbar, SearchField } from "./DataToolbar";
import { ErrorMessage } from "./ErrorMessage";
import { Panel } from "./Panel";
import { PermissionHint } from "./PermissionHint";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";

type ResourcePanelProps<TResource extends { id: string; key: string; name: string }> = {
  emptyMessage: string;
  items: TResource[];
  onSelect: (resourceId: string) => void;
  permissionHint?: string;
  queryError: unknown;
  selectedId: string;
  title: string;
};

export function ResourcePanel<TResource extends { id: string; key: string; name: string }>({
  emptyMessage,
  items,
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

    return [item.name, item.key, formatResourceLabel(item)]
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
              paginatedItems.map((item) => (
                <TableRow
                  data-state={selectedId === item.id ? "selected" : undefined}
                  key={item.id}
                >
                  <TableCell className="min-w-52">
                    <strong className="block text-foreground">{item.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {formatResourceLabel(item)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.key}
                  </TableCell>
                  <TableCell>
                    {selectedId === item.id ? <Badge variant="secondary">Selecionado</Badge> : null}
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
                </TableRow>
              ))
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
