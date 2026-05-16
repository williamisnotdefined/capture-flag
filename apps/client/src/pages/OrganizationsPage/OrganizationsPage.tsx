import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateOrganization, useDeleteOrganization } from "../../api/organizations";
import {
  ActionMenu,
  ActionMenuItem,
  ActionMenuLink,
  Badge,
  Button,
  DataTablePagination,
  DataToolbar,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ErrorMessage,
  FieldError,
  PageLayout,
  SearchField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from "../../components";
import { organizationPath } from "../../layouts/PlatformLayout/routePaths";
import { useOrganizationRouteContext } from "../../layouts/PlatformLayout/useRouteContext";

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
        onDelete={deleteOrganization}
        organizations={organizations}
      />
      {meQuery.isFetching ? (
        <p className="mt-4 text-sm text-stone-600">Atualizando organizacoes...</p>
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
          <label className="text-sm font-medium text-slate-900" htmlFor={organizationInputId}>
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
        <DialogFooter>
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
  onDelete: (organization: OrganizationRow) => void;
  organizations: OrganizationRow[];
};

function OrganizationsTable({ isDeleting, onDelete, organizations }: OrganizationsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearchInput = useDeferredValue(searchInput.trim().toLowerCase());
  const visibleOrganizations = organizations.filter((organization) => {
    if (!deferredSearchInput) {
      return true;
    }

    return [organization.name, organization.slug, organization.role]
      .join(" ")
      .toLowerCase()
      .includes(deferredSearchInput);
  });
  const pageCount = Math.max(1, Math.ceil(visibleOrganizations.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedOrganizations = visibleOrganizations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar organizacoes"
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by name, slug or role..."
          value={searchInput}
        />
      </DataToolbar>
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organizacao</TableHead>
              <TableHead>Projetos</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrganizations.length > 0 ? (
              paginatedOrganizations.map((organization) => (
                <TableRow className="text-foreground" key={organization.id}>
                  <TableCell className="min-w-52">
                    <strong className="block text-foreground">{organization.name}</strong>
                    <span className="block break-all font-mono text-xs text-muted-foreground">
                      {organization.slug}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{organization.projectCount}</TableCell>
                  <TableCell className="font-medium">{organization.memberCount}</TableCell>
                  <TableCell>
                    <Badge className="uppercase" variant="secondary">
                      {organization.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu label={`Acoes para ${organization.name}`}>
                      <ActionMenuLink
                        aria-label={`Editar ${organization.name}`}
                        to={organizationPath(organization.id)}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        Editar
                      </ActionMenuLink>
                      <ActionMenuItem
                        aria-label={`Excluir ${organization.name}`}
                        destructive
                        disabled={isDeleting || organization.role !== "owner"}
                        onClick={() => onDelete(organization)}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        Excluir
                      </ActionMenuItem>
                    </ActionMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                  {organizations.length === 0
                    ? "Sem organizacoes."
                    : "Nenhuma organizacao encontrada."}
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
        totalItems={visibleOrganizations.length}
      />
    </div>
  );
}
