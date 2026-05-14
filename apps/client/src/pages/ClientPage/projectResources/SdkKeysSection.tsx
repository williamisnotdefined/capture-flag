import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiBaseUrl } from "../../../api/client";
import {
  useCreateSdkKey,
  useGetProjectSdkKeys,
  useRevokeSdkKey,
  useRotateSdkKey,
} from "../../../api/sdkKeys";
import {
  Button,
  ErrorMessage,
  FieldError,
  Panel,
  PermissionHint,
  TextInput,
} from "../../../components";
import type { Config, Environment } from "../../../types";
import { CreatedSdkKeyNotice } from "./CreatedSdkKeyNotice";
import { SdkKeyList } from "./SdkKeyList";
import { useClipboardMessage } from "./useClipboardMessage";

const sdkKeyFormSchema = z.object({
  name: z.string().max(120, "Use ate 120 caracteres."),
});

type CreatedSdkKeyState = {
  configId: string;
  environmentId: string;
  id: string;
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
      setVisibleRawSdkKey(sdkKey);
    },
  });
  const revokeSdkKeyMutation = useRevokeSdkKey({ projectId: selectedProjectId });
  const rotateSdkKeyMutation = useRotateSdkKey({
    projectId: selectedProjectId,
    onSuccess: setVisibleRawSdkKey,
  });
  const canCreateSdkKey = Boolean(
    selectedProjectId &&
      selectedConfig?.projectId === selectedProjectId &&
      selectedEnvironment?.projectId === selectedProjectId &&
      canManageProjectResources,
  );

  const visibleCreatedSdkKey =
    createdSdkKey && createdSdkKey.projectId === selectedProjectId ? createdSdkKey : null;
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

  function setVisibleRawSdkKey(sdkKey: {
    configId: string;
    environmentId: string;
    id: string;
    key?: string;
    projectId: string;
  }) {
    setCreatedSdkKey(
      sdkKey.key
        ? {
            configId: sdkKey.configId,
            environmentId: sdkKey.environmentId,
            id: sdkKey.id,
            key: sdkKey.key,
            projectId: sdkKey.projectId,
          }
        : null,
    );
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
      <ErrorMessage error={revokeSdkKeyMutation.error} />
      <ErrorMessage error={rotateSdkKeyMutation.error} />

      {visibleCreatedSdkKey ? (
        <CreatedSdkKeyNotice
          copyMessage={clipboard.copyMessage}
          onCopy={handleCopySdkKey}
          publicConfigUrl={visiblePublicConfigUrl}
          sdkKey={visibleCreatedSdkKey.key}
        />
      ) : null}

      <SdkKeyList
        canManageProjectResources={canManageProjectResources}
        isFetching={sdkKeysQuery.isFetching}
        isMutating={revokeSdkKeyMutation.isPending || rotateSdkKeyMutation.isPending}
        onRevoke={(sdkKeyId) => {
          if (createdSdkKey?.id === sdkKeyId) {
            setCreatedSdkKey(null);
          }
          revokeSdkKeyMutation.mutate(sdkKeyId);
        }}
        onRotate={(sdkKeyId) => rotateSdkKeyMutation.mutate(sdkKeyId)}
        sdkKeys={sdkKeys}
      />
    </Panel>
  );
}
