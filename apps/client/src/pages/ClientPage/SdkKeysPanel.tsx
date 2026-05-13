import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Panel } from "../../components/Panel";
import { Button, ErrorMessage, FieldError, PermissionHint, TextInput } from "../../components/ui";
import type { SdkKey } from "../../types";
import type { CreatedSdkKeyState } from "./types";

const sdkKeyFormSchema = z.object({
  name: z.string().max(120, "Use ate 120 caracteres."),
});

type SdkKeyFormValues = z.infer<typeof sdkKeyFormSchema>;

type SdkKeysPanelProps = {
  canCreateSdkKey: boolean;
  canManageProjectResources: boolean;
  copyMessage: string;
  createError: unknown;
  createdSdkKey: CreatedSdkKeyState | null;
  isCreating: boolean;
  isFetching: boolean;
  onCopySdkKey: () => Promise<void>;
  onCreateSdkKey: (values: SdkKeyFormValues) => Promise<unknown>;
  publicConfigUrl: string;
  queryError: unknown;
  sdkKeys: SdkKey[];
};

export function SdkKeysPanel({
  canCreateSdkKey,
  canManageProjectResources,
  copyMessage,
  createError,
  createdSdkKey,
  isCreating,
  isFetching,
  onCopySdkKey,
  onCreateSdkKey,
  publicConfigUrl,
  queryError,
  sdkKeys,
}: SdkKeysPanelProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<SdkKeyFormValues>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(sdkKeyFormSchema),
  });

  async function submit(values: SdkKeyFormValues) {
    try {
      await onCreateSdkKey(values);
      reset();
    } catch {
      // Mutation hooks expose the error state in the page.
    }
  }

  const isDisabled = !canCreateSdkKey || isCreating || isSubmitting;

  return (
    <Panel title="SDK Keys" wide>
      <form
        className="grid gap-3 lg:grid-cols-[1.4fr_auto]"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div className="grid gap-2">
          <TextInput
            aria-invalid={errors.name ? true : undefined}
            disabled={isDisabled}
            placeholder="Nome da SDK key"
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <Button className="self-start" disabled={isDisabled} type="submit">
          {isCreating ? "Gerando..." : "Gerar key"}
        </Button>
      </form>
      {!canManageProjectResources ? (
        <PermissionHint>Voce nao tem permissao para gerar SDK keys neste projeto.</PermissionHint>
      ) : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={createError} />

      {createdSdkKey ? (
        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white">
          <span>Copie agora. A chave completa nao sera exibida novamente.</span>
          <code className="break-all">{createdSdkKey.key}</code>
          <span className="text-sm text-white/80">Endpoint publico</span>
          <code className="break-all text-sm text-white/90">{publicConfigUrl}</code>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={onCopySdkKey} type="button" variant="secondary">
              Copiar
            </Button>
            {copyMessage ? <span className="text-sm text-white/80">{copyMessage}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {sdkKeys.map((sdkKey) => (
          <div
            className="grid items-center gap-2 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
            key={sdkKey.id}
          >
            <strong className="text-slate-900">{sdkKey.name}</strong>
            <span>{sdkKey.keyPrefix}...</span>
            <span>
              {sdkKey.config.name} / {sdkKey.environment.name}
            </span>
            <span>{sdkKey.revokedAt ? "revogada" : "ativa"}</span>
          </div>
        ))}
        {sdkKeys.length === 0 && !isFetching ? (
          <p className="text-sm text-stone-600">Sem SDK keys</p>
        ) : null}
      </div>
    </Panel>
  );
}
