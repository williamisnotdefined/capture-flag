import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useCreateOrganization, useDeleteOrganization } from "../../api/organizations";
import {
  Button,
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
  Panel,
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
    <Panel title="Organizacoes" wide>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          Gerencie as organizacoes, edite detalhes e mantenha membros em cada tenant.
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="inline-flex items-center justify-center gap-2" type="button">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nova organizacao
            </Button>
          </DialogTrigger>
          <NewOrganizationDialogContent
            error={createOrganizationMutation.error}
            isPending={createOrganizationMutation.isPending}
            onSubmit={createOrganization}
            open={isCreateOpen}
          />
        </Dialog>
      </div>
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
    </Panel>
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
  if (organizations.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem organizacoes.</p>;
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Organizacao</TableHead>
            <TableHead>Projetos</TableHead>
            <TableHead>Membros</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((organization) => (
            <TableRow className="text-slate-800" key={organization.id}>
              <TableCell className="min-w-52">
                <strong className="block text-slate-900">{organization.name}</strong>
                <span className="block break-all font-mono text-xs text-stone-600">
                  {organization.slug}
                </span>
              </TableCell>
              <TableCell className="font-medium">{organization.projectCount}</TableCell>
              <TableCell className="font-medium">{organization.memberCount}</TableCell>
              <TableCell>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                  {organization.role}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Link
                    aria-label={`Editar ${organization.name}`}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                    to={organizationPath(organization.id)}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    Editar
                  </Link>
                  <Button
                    aria-label={`Excluir ${organization.name}`}
                    className="h-8 px-2"
                    disabled={isDeleting || organization.role !== "owner"}
                    onClick={() => onDelete(organization)}
                    type="button"
                    variant="danger"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
