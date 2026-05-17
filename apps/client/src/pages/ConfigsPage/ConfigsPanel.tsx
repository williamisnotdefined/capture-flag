import { useDeleteConfig, useUpdateConfig } from "@api/configs";
import { Button } from "@components/Button";
import { FieldError } from "@components/FieldError";
import { TextareaInput } from "@components/FormControls";
import { PermissionHint } from "@components/PermissionHint";
import { ResourcePanel } from "@components/ResourcePanel";
import { zodResolver } from "@hookform/resolvers/zod";
import { configsPath } from "@routing/routePaths";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageProjectResources } from "@src/permissions";
import type { Config } from "@src/types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const configDescriptionFormSchema = z.object({
  description: z.string().max(500, "Use ate 500 caracteres."),
});

type ConfigDescriptionFormValues = z.infer<typeof configDescriptionFormSchema>;

export function ConfigsPanel() {
  const navigate = useNavigate();
  const {
    configs,
    configsQuery,
    organizationRole,
    selectedConfig,
    selectedConfigId,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const updateConfigMutation = useUpdateConfig({ projectId: selectedProjectId });
  const deleteConfigMutation = useDeleteConfig({
    projectId: selectedProjectId,
    onSuccess: (deletedConfigId) => {
      if (deletedConfigId === selectedConfigId) {
        navigate(configsPath(selectedOrganizationId, selectedProjectId));
      }
    },
  });

  function canDeleteConfig() {
    return canManageProjectResourceActions;
  }

  function deleteConfig(config: Config) {
    if (!canDeleteConfig()) {
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir a config "${config.name}"? Ela deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteConfigMutation.mutate(config.id);
  }

  function deleteConfigs(selectedConfigs: Config[]) {
    const deletableConfigs = selectedConfigs.filter(canDeleteConfig);
    if (deletableConfigs.length === 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir ${formatConfigSelectionLabel(deletableConfigs.length)}? Elas deixarao de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    for (const config of deletableConfigs) {
      deleteConfigMutation.mutate(config.id);
    }
  }

  return (
    <>
      <ResourcePanel
        canEditName={canManageProjectResourceActions}
        canDeleteItem={canDeleteConfig}
        deleteDisabled={deleteConfigMutation.isPending}
        deleteLabel="Excluir"
        emptyMessage="Sem configs"
        getDescription={(config) => config.description}
        items={configs}
        mutationError={updateConfigMutation.error ?? deleteConfigMutation.error}
        nameEditDisabled={updateConfigMutation.isPending}
        onBulkDelete={deleteConfigs}
        onDelete={deleteConfig}
        onRename={(config, name) => updateConfigMutation.mutateAsync({ configId: config.id, name })}
        onSelect={(configId) =>
          navigate(configsPath(selectedOrganizationId, selectedProjectId, configId))
        }
        permissionHint={
          !canManageProjectResourceActions
            ? "Voce nao tem permissao para criar, editar ou excluir configs neste projeto."
            : undefined
        }
        queryError={configsQuery.error}
        selectionLabel={formatConfigSelectionLabel}
        selectedId={selectedConfigId}
        title="Configs"
      />
      {selectedConfig ? (
        <ConfigDescriptionEditor
          canEdit={canManageProjectResourceActions}
          config={selectedConfig}
          disabled={updateConfigMutation.isPending}
          key={selectedConfig.id}
          onSubmit={(description) =>
            updateConfigMutation.mutateAsync({ configId: selectedConfig.id, description })
          }
        />
      ) : null}
    </>
  );
}

function formatConfigSelectionLabel(selectedCount: number) {
  return selectedCount === 1 ? "1 config selecionada" : `${selectedCount} configs selecionadas`;
}

function ConfigDescriptionEditor({
  canEdit,
  config,
  disabled,
  onSubmit,
}: {
  canEdit: boolean;
  config: Config;
  disabled: boolean;
  onSubmit: (description: string) => Promise<unknown>;
}) {
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ConfigDescriptionFormValues>({
    defaultValues: {
      description: config.description ?? "",
    },
    resolver: zodResolver(configDescriptionFormSchema),
  });

  useEffect(() => {
    reset({ description: config.description ?? "" });
  }, [config.description, reset]);

  const isDisabled = disabled || isSubmitting || !canEdit;

  async function submit(values: ConfigDescriptionFormValues) {
    try {
      const description = values.description.trim();
      await onSubmit(description);
      reset({ description });
    } catch {
      // Mutation hooks expose the error state in the resource panel.
    }
  }

  return (
    <section className="rounded-md border border-border bg-background p-4">
      <div className="mb-3">
        <h2 className="font-semibold text-foreground">Descricao da config</h2>
        <p className="text-sm text-muted-foreground">
          Metadata interna para explicar onde esta config e usada.
        </p>
      </div>
      <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
        <div>
          <TextareaInput
            aria-invalid={errors.description ? true : undefined}
            disabled={isDisabled}
            placeholder="Ex.: Config consumida pelo SDK web."
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </div>
        <Button className="justify-self-start" disabled={isDisabled || !isDirty} type="submit">
          Salvar descricao
        </Button>
      </form>
      {!canEdit ? (
        <PermissionHint>Somente owner, admin ou project_admin pode editar configs.</PermissionHint>
      ) : null}
    </section>
  );
}
