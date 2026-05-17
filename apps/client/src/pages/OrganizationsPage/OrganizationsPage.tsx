import { useCreateOrganization, useDeleteOrganization } from "@api/organizations";
import { ActionMenu, ActionMenuItem, ActionMenuLink } from "@components/ActionMenu";
import { Badge } from "@components/Badge";
import { Button } from "@components/Button";
import { DataToolbar, SearchField } from "@components/DataToolbar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/Dialog";
import { ErrorMessage } from "@components/ErrorMessage";
import { FieldError } from "@components/FieldError";
import { TextInput } from "@components/FormControls";
import { PageLayout } from "@components/PageLayout";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationPath } from "@routing/routePaths";
import { useOrganizationRouteContext } from "@routing/useRouteContext";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const organizationFormSchema = z.object({
  name: z.string().trim().min(1, "Informe uma organizacao.").max(120, "Use ate 120 caracteres."),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
type OrganizationRow = ReturnType<typeof useOrganizationRouteContext>["organizations"][number];

export function OrganizationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { meQuery, organizations } = useOrganizationRouteContext();
  const createOrganizationMutation = useCreateOrganization();
  const deleteOrganizationMutation = useDeleteOrganization();

  async function createOrganization(name: string) {
    await createOrganizationMutation.mutateAsync(name);
    setIsCreateOpen(false);
  }

  function deleteOrganization(organization: OrganizationRow) {
    if (organization.role !== "owner") {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar a organizacao "${organization.name}"? Ela deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteOrganizationMutation.mutate(organization.id);
  }

  function deleteOrganizations(selectedOrganizations: OrganizationRow[]) {
    const deletableOrganizations = selectedOrganizations.filter(
      (organization) => organization.role === "owner",
    );
    if (deletableOrganizations.length === 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar ${formatOrganizationSelectionLabel(deletableOrganizations.length)}? Elas deixarao de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    for (const organization of deletableOrganizations) {
      deleteOrganizationMutation.mutate(organization.id);
    }
  }

  return (
    <PageLayout
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="inline-flex items-center justify-center gap-2" type="button">
              <span>Nova organizacao</span>
              <Plus aria-hidden="true" className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <NewOrganizationDialogContent
            error={createOrganizationMutation.error}
            isPending={createOrganizationMutation.isPending}
            onSubmit={createOrganization}
            open={isCreateOpen}
          />
        </Dialog>
      }
      description="Gerencie as organizacoes, edite detalhes e mantenha membros em cada tenant."
      eyebrow="Workspace"
      title="Organizacoes"
    >
      <ErrorMessage error={meQuery.error} />
      <ErrorMessage error={deleteOrganizationMutation.error} />
      <OrganizationsTable
        isDeleting={deleteOrganizationMutation.isPending}
        onBulkDelete={deleteOrganizations}
        onDelete={deleteOrganization}
        organizations={organizations}
      />
      {meQuery.isFetching ? (
        <p className="mt-4 text-sm text-muted-foreground">Atualizando organizacoes...</p>
      ) : null}
    </PageLayout>
  );
}

type NewOrganizationDialogContentProps = {
  error: unknown;
  isPending: boolean;
  onSubmit: (name: string) => Promise<unknown>;
  open: boolean;
};

function NewOrganizationDialogContent({
  error,
  isPending,
  onSubmit,
  open,
}: NewOrganizationDialogContentProps) {
  const organizationInputId = useId();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<OrganizationFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(organizationFormSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "" });
    }
  }, [open, reset]);

  const isDisabled = isPending || isSubmitting;

  async function submit(values: OrganizationFormValues) {
    try {
      await onSubmit(values.name);
      reset({ name: "" });
    } catch {
      // Mutation hooks expose the error state in the dialog.
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova organizacao</DialogTitle>
        <DialogDescription>
          Informe o nome da organizacao para criar um novo tenant.
        </DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" noValidate onSubmit={handleSubmit(submit)}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor={organizationInputId}>
            Organizacao
          </label>
          <TextInput
            aria-invalid={errors.name ? true : undefined}
            autoFocus
            disabled={isDisabled}
            id={organizationInputId}
            placeholder="Nome da organizacao"
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <ErrorMessage error={error} />
        <DialogFooter className="border-t border-border pt-4">
          <DialogClose asChild>
            <Button disabled={isDisabled} type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={isDisabled} type="submit">
            {isPending ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

type OrganizationsTableProps = {
  isDeleting: boolean;
  onBulkDelete: (organizations: OrganizationRow[]) => void;
  onDelete: (organization: OrganizationRow) => void;
  organizations: OrganizationRow[];
};

function OrganizationsTable({
  isDeleting,
  onBulkDelete,
  onDelete,
  organizations,
}: OrganizationsTableProps) {
  const navigate = useNavigate();
  const columns: ColumnDef<OrganizationRow>[] = [
    {
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label="Selecionar organizacoes da pagina"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        />
      ),
      id: "select",
      meta: { className: "w-10" },
    },
    {
      accessorFn: (organization) => organization.name,
      cell: ({ row }) => (
        <div>
          <strong className="block text-foreground">{row.original.name}</strong>
          <span className="block break-all font-mono text-xs text-muted-foreground">
            {row.original.slug}
          </span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Organizacao" />,
      id: "organization",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorKey: "projectCount",
      cell: ({ row }) => <span className="font-medium">{row.original.projectCount}</span>,
      header: ({ column }) => <ColumnHeader column={column} title="Projetos" />,
    },
    {
      accessorKey: "memberCount",
      cell: ({ row }) => <span className="font-medium">{row.original.memberCount}</span>,
      header: ({ column }) => <ColumnHeader column={column} title="Membros" />,
    },
    {
      accessorKey: "role",
      cell: ({ row }) => (
        <Badge className="uppercase" variant="secondary">
          {row.original.role}
        </Badge>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Role" />,
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuLink
            aria-label={`Editar ${row.original.name}`}
            to={organizationPath(row.original.id)}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Editar
          </ActionMenuLink>
          <ActionMenuItem
            aria-label={`Excluir ${row.original.name}`}
            destructive
            disabled={isDeleting || row.original.role !== "owner"}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Excluir
          </ActionMenuItem>
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: organizations,
    enableRowSelection: (row) => row.original.role === "owner",
    getRowId: (organization) => organization.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [row.original.name, row.original.slug, row.original.role]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });
  const selectedOrganizations = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar organizacoes"
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Filter by name, slug or role..."
          value={table.getState().globalFilter ?? ""}
        />
      </DataToolbar>
      <Table
        emptyMessage={
          organizations.length === 0 ? "Sem organizacoes." : "Nenhuma organizacao encontrada."
        }
        getRowAriaLabel={(row) => `Editar ${row.original.name}`}
        getRowClassName={() => "text-foreground"}
        onRowActivate={(row) => navigate(organizationPath(row.original.id))}
        rowActivationRole="link"
        table={table}
      />
      <Pagination table={table} />
      <BulkActions
        selectionLabel={(selectedCount) => formatOrganizationSelectionLabel(selectedCount)}
        table={table}
      >
        <Button
          disabled={isDeleting || selectedOrganizations.length === 0}
          onClick={() => {
            onBulkDelete(selectedOrganizations);
            table.resetRowSelection();
          }}
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Excluir
        </Button>
      </BulkActions>
    </div>
  );
}

function formatOrganizationSelectionLabel(selectedCount: number) {
  return selectedCount === 1
    ? "1 organizacao selecionada"
    : `${selectedCount} organizacoes selecionadas`;
}
