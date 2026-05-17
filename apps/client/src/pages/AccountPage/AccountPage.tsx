import { useGetMe, useUpdateMe } from "@api/auth";
import { Button } from "@components/Button";
import { ErrorMessage } from "@components/ErrorMessage";
import { FieldError } from "@components/FieldError";
import { TextInput } from "@components/FormControls";
import { PageLayout } from "@components/PageLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Use ate 120 caracteres."),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountPage() {
  const meQuery = useGetMe();
  const updateMeMutation = useUpdateMe();
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

  const isDisabled = isSubmitting || updateMeMutation.isPending || meQuery.isLoading;

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
              <TextInput id="account-email" readOnly value={user.email ?? "Sem email cadastrado"} />
              <p className="text-xs text-muted-foreground">
                Para alterar email, atualize a conta vinculada ao login OAuth.
              </p>
            </div>
            <ErrorMessage error={updateMeMutation.error} />
            {updateMeMutation.isSuccess ? (
              <p className="text-sm font-medium text-emerald-600">Dados salvos.</p>
            ) : null}
            <div className="flex justify-end border-t border-border pt-4">
              <Button disabled={isDisabled} type="submit">
                {updateMeMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </PageLayout>
  );
}
