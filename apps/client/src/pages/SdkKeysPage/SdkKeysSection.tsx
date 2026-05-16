import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { publicApiV1BaseUrl } from "../../api/client";
import {
  useCreateSdkKey,
  useGetProjectSdkKeys,
  useRevokeSdkKey,
  useRotateSdkKey,
} from "../../api/sdkKeys";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorMessage,
  FieldError,
  Panel,
  PermissionHint,
  TextInput,
} from "../../components";
import { useClipboardMessage } from "../../core/hooks/useClipboardMessage";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageProjectResources } from "../../permissions";
import type { Config, Environment } from "../../types";
import { CreatedSdkKeyNotice } from "./CreatedSdkKeyNotice";
import { SdkKeyList } from "./SdkKeyList";

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
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
};

type SdkKeysPanelProps = {
  canManageProjectResources: boolean;
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  selectedConfig: Config | undefined;
  selectedEnvironment: Environment | undefined;
  selectedProjectId: string;
};

export function SdkKeysSection({ isCreateOpen, onCreateOpenChange }: SdkKeysSectionProps) {
  const {
    organizationRole,
    selectedConfig,
    selectedEnvironment,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <SdkKeysPanel
      canManageProjectResources={canManageProjectResourceActions}
      isCreateOpen={isCreateOpen}
      key={`${selectedProjectId}:${selectedConfig?.id ?? ""}:${selectedEnvironment?.id ?? ""}`}
      onCreateOpenChange={onCreateOpenChange}
      selectedConfig={selectedConfig}
      selectedEnvironment={selectedEnvironment}
      selectedProjectId={selectedProjectId}
    />
  );
}

function SdkKeysPanel({
  canManageProjectResources,
  isCreateOpen,
  onCreateOpenChange,
  selectedConfig,
  selectedEnvironment,
  selectedProjectId,
}: SdkKeysPanelProps) {
  const [createdSdkKey, setCreatedSdkKey] = useState<CreatedSdkKeyState | null>(null);
  const sdkKeysQuery = useGetProjectSdkKeys(selectedProjectId);
  const clipboard = useClipboardMessage({ successMessage: "Chave copiada." });
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
    createdSdkKey &&
    createdSdkKey.projectId === selectedProjectId &&
    createdSdkKey.configId === selectedConfig?.id &&
    createdSdkKey.environmentId === selectedEnvironment?.id
      ? createdSdkKey
      : null;
  const visiblePublicConfigUrl = visibleCreatedSdkKey
    ? `${publicApiV1BaseUrl}/sdk/${encodeURIComponent(visibleCreatedSdkKey.key)}/config`
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
      onCreateOpenChange(false);
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
    <Panel showTitle={false} title="SDK Keys" wide>
      <Dialog open={isCreateOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar SDK key</DialogTitle>
            <DialogDescription>
              Gere uma chave para a config e environment selecionados no topo da tela.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
            <div className="grid gap-2">
              <TextInput
                aria-invalid={errors.name ? true : undefined}
                disabled={isDisabled}
                placeholder="Nome da SDK key"
                {...register("name")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </div>
            <Button className="self-start justify-self-start" disabled={isDisabled} type="submit">
              {createSdkKeyMutation.isPending ? "Gerando..." : "Gerar key"}
            </Button>
          </form>
          <ErrorMessage error={createSdkKeyMutation.error} />
        </DialogContent>
      </Dialog>
      {!canManageProjectResources ? (
        <PermissionHint>Voce nao tem permissao para gerar SDK keys neste projeto.</PermissionHint>
      ) : null}
      <ErrorMessage error={sdkKeysQuery.error} />
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
