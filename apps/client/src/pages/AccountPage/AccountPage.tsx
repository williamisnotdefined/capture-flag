import { useDeleteMe, useGetMe, useUpdateMe } from "@api/auth";
import { Button } from "@components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/Dialog";
import { ErrorMessage } from "@components/ErrorMessage";
import { FieldError } from "@components/FieldError";
import { TextInput } from "@components/FormControls";
import { PageLayout } from "@components/PageLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const deleteConfirmationText = "EXCLUIR";

const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const deleteAccountFormSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value): boolean => value === deleteConfirmationText, {
      message: `Digite ${deleteConfirmationText} para confirmar.`,
    }),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;

export function AccountPage() {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const meQuery = useGetMe();
  const updateMeMutation = useUpdateMe();
  const deleteMeMutation = useDeleteMe({
    onSuccess: () => navigate("/login"),
  });
  const user = meQuery.data?.user;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AccountFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(accountFormSchema),
  });
  const {
    formState: { errors: deleteErrors, isSubmitting: isDeletingSubmitting },
    handleSubmit: handleDeleteSubmit,
    register: registerDelete,
    reset: resetDelete,
    watch: watchDelete,
  } = useForm<DeleteAccountFormValues>({
    defaultValues: {
      confirmation: "",
    },
    resolver: zodResolver(deleteAccountFormSchema),
  });

  useEffect(() => {
    reset({ name: user?.name ?? "" });
  }, [reset, user?.name]);

  async function submit(values: AccountFormValues) {
    if (!user || values.name === user.name) {
      return;
    }

    try {
      await updateMeMutation.mutateAsync({ name: values.name });
    } catch {
      // Mutation state renders the API error below the form.
    }
  }

  async function deleteAccount() {
    try {
      await deleteMeMutation.mutateAsync();
    } catch {
      // Mutation state renders the API error below the delete form.
    }
  }

  function handleDeleteOpenChange(open: boolean) {
    setIsDeleteOpen(open);

    if (!open) {
      resetDelete({ confirmation: "" });
    }
  }

  const isDisabled = isSubmitting || updateMeMutation.isPending || meQuery.isLoading;
  const deleteConfirmation = watchDelete("confirmation");
  const isDeleteDisabled =
    isDeletingSubmitting ||
    deleteMeMutation.isPending ||
    meQuery.isLoading ||
    deleteConfirmation.trim() !== deleteConfirmationText;

  return (
    <PageLayout
      description="Gerencie os dados globais usados para identificar sua conta na plataforma."
      eyebrow="Conta"
      title="Minha conta"
    >
      {meQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados da conta...</p>
      ) : null}
      <ErrorMessage error={meQuery.error} />
      {user ? (
        <div className="grid gap-4">
          <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-xs sm:p-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Perfil</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O email vem do provedor OAuth e fica somente leitura por enquanto.
              </p>
            </div>
            <form className="grid gap-4" noValidate onSubmit={handleSubmit(submit)}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="account-name">
                  Nome
                </label>
                <TextInput
                  aria-invalid={errors.name ? true : undefined}
                  disabled={isDisabled}
                  id="account-name"
                  {...register("name")}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="account-email">
                  Email
                </label>
                <TextInput
                  id="account-email"
                  readOnly
                  value={user.email ?? "Sem email cadastrado"}
                />
                <p className="text-xs text-muted-foreground">
                  Para alterar email, atualize a conta vinculada ao login OAuth.
                </p>
              </div>
              <ErrorMessage error={updateMeMutation.error} />
              {updateMeMutation.isSuccess ? (
                <p className="text-sm font-medium text-emerald-600">Dados salvos.</p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMeMutation.isPending}
                  onClick={() => handleDeleteOpenChange(true)}
                  type="button"
                  variant="secondary"
                >
                  Excluir conta
                </Button>
                <Button disabled={isDisabled} type="submit">
                  {updateMeMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </section>
          <Dialog onOpenChange={handleDeleteOpenChange} open={isDeleteOpen}>
            <DialogContent className="border-destructive/30">
              <DialogHeader>
                <DialogTitle>Excluir conta</DialogTitle>
                <DialogDescription>
                  A exclusao anonimiza seus dados pessoais, revoga sessoes e API tokens, remove
                  vinculos OAuth e memberships. O historico de audit continua preservado.
                </DialogDescription>
                <p className="text-sm text-muted-foreground">
                  Se voce for o unico owner de uma organizacao ativa, transfira a ownership ou
                  arquive a organizacao antes de excluir a conta.
                </p>
              </DialogHeader>
              <form className="grid gap-4" noValidate onSubmit={handleDeleteSubmit(deleteAccount)}>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="account-delete-confirmation"
                  >
                    Digite {deleteConfirmationText} para confirmar
                  </label>
                  <TextInput
                    aria-invalid={deleteErrors.confirmation ? true : undefined}
                    disabled={deleteMeMutation.isPending}
                    id="account-delete-confirmation"
                    {...registerDelete("confirmation")}
                  />
                  <FieldError>{deleteErrors.confirmation?.message}</FieldError>
                </div>
                <ErrorMessage error={deleteMeMutation.error} />
                <DialogFooter className="border-t border-destructive/20 pt-4">
                  <DialogClose asChild>
                    <Button disabled={deleteMeMutation.isPending} type="button" variant="secondary">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button disabled={isDeleteDisabled} type="submit" variant="danger">
                    {deleteMeMutation.isPending ? "Excluindo..." : "Excluir conta"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </PageLayout>
  );
}
