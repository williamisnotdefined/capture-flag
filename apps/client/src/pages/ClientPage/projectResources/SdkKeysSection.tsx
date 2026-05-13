import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiBaseUrl } from "../../../api/client";
import { useCreateSdkKey, useGetProjectSdkKeys } from "../../../api/sdkKeys";
import { Panel } from "../../../components/Panel";
import {
  Button,
  ErrorMessage,
  FieldError,
  PermissionHint,
  TextInput,
} from "../../../components/ui";
import type { Config, Environment } from "../../../types";
import { useClipboardMessage } from "./useClipboardMessage";

const sdkKeyFormSchema = z.object({
  name: z.string().max(120, "Use ate 120 caracteres."),
});

type CreatedSdkKeyState = {
  configId: string;
  environmentId: string;
  key: string;
  projectId: string;
};

type SdkKeyFormValues = z.infer<typeof sdkKeyFormSchema>;

type SdkKeysSectionProps = {
  canManageProjectResources: boolean;
  selectedConfig: Config | undefined;
  selectedEnvironment: Environment | undefined;
  selectedProjectId: string;
};

export function SdkKeysSection({
  canManageProjectResources,
  selectedConfig,
  selectedEnvironment,
  selectedProjectId,
}: SdkKeysSectionProps) {
  const [createdSdkKey, setCreatedSdkKey] = useState<CreatedSdkKeyState | null>(null);
  const sdkKeysQuery = useGetProjectSdkKeys(selectedProjectId);
  const clipboard = useClipboardMessage();
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

  const createSdkKeyMutation = useCreateSdkKey({
    projectId: selectedProjectId,
    onSuccess: (sdkKey) => {
      setCreatedSdkKey(
        sdkKey.key
          ? {
              configId: sdkKey.configId,
              environmentId: sdkKey.environmentId,
              key: sdkKey.key,
              projectId: sdkKey.projectId,
            }
          : null,
      );
    },
  });
  const selectedConfigId = selectedConfig?.id ?? "";
  const selectedEnvironmentId = selectedEnvironment?.id ?? "";
  const canCreateSdkKey = Boolean(
    selectedProjectId &&
      selectedConfig?.projectId === selectedProjectId &&
      selectedEnvironment?.projectId === selectedProjectId &&
      canManageProjectResources,
  );

  const visibleCreatedSdkKey =
    createdSdkKey &&
    createdSdkKey.projectId === selectedProjectId &&
    createdSdkKey.configId === selectedConfigId &&
    createdSdkKey.environmentId === selectedEnvironmentId
      ? createdSdkKey
      : null;
  const visiblePublicConfigUrl = visibleCreatedSdkKey
    ? `${apiBaseUrl}/public/sdk/${encodeURIComponent(visibleCreatedSdkKey.key)}/config`
    : "";
  const sdkKeys = sdkKeysQuery.data ?? [];
  const isDisabled = !canCreateSdkKey || createSdkKeyMutation.isPending || isSubmitting;

  async function submit(values: SdkKeyFormValues) {
    if (!selectedConfig || !selectedEnvironment) {
      return;
    }

    try {
      const name = values.name.trim();

      await createSdkKeyMutation.mutateAsync({
        configId: selectedConfig.id,
        environmentId: selectedEnvironment.id,
        ...(name ? { name } : {}),
      });
      reset();
    } catch {
      // Mutation hooks expose the error state in the section.
    }
  }

  async function handleCopySdkKey() {
    if (!visibleCreatedSdkKey) {
      return;
    }

    await clipboard.copyText(visibleCreatedSdkKey.key);
  }

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
          {createSdkKeyMutation.isPending ? "Gerando..." : "Gerar key"}
        </Button>
      </form>
      {!canManageProjectResources ? (
        <PermissionHint>Voce nao tem permissao para gerar SDK keys neste projeto.</PermissionHint>
      ) : null}
      <ErrorMessage error={sdkKeysQuery.error} />
      <ErrorMessage error={createSdkKeyMutation.error} />

      {visibleCreatedSdkKey ? (
        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white">
          <span>Copie agora. A chave completa nao sera exibida novamente.</span>
          <code className="break-all">{visibleCreatedSdkKey.key}</code>
          <span className="text-sm text-white/80">Endpoint publico</span>
          <code className="break-all text-sm text-white/90">{visiblePublicConfigUrl}</code>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={handleCopySdkKey} type="button" variant="secondary">
              Copiar
            </Button>
            {clipboard.copyMessage ? (
              <span className="text-sm text-white/80">{clipboard.copyMessage}</span>
            ) : null}
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
        {sdkKeys.length === 0 && !sdkKeysQuery.isFetching ? (
          <p className="text-sm text-stone-600">Sem SDK keys</p>
        ) : null}
      </div>
    </Panel>
  );
}
