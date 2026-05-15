import { useCreateConfig } from "../../api/configs";
import type { Config } from "../../types";
import { ResourcePanel } from "../_shared/ResourcePanel";

type ConfigsPanelProps = {
  canManageProjectResources: boolean;
  configs: Config[];
  onSelect: (configId: string) => void;
  queryError: unknown;
  selectedConfigId: string;
  selectedProjectId: string;
};

export function ConfigsPanel({
  canManageProjectResources,
  configs,
  onSelect,
  queryError,
  selectedConfigId,
  selectedProjectId,
}: ConfigsPanelProps) {
  const createConfigMutation = useCreateConfig({ projectId: selectedProjectId });

  return (
    <ResourcePanel
      create={{
        disabled:
          !selectedProjectId || !canManageProjectResources || createConfigMutation.isPending,
        error: createConfigMutation.error,
        onSubmit: createConfigMutation.mutateAsync,
        placeholder: "Nova config",
      }}
      emptyMessage="Sem configs"
      items={configs}
      onSelect={onSelect}
      permissionHint={
        !canManageProjectResources
          ? "Voce nao tem permissao para criar configs neste projeto."
          : undefined
      }
      queryError={queryError}
      selectedId={selectedConfigId}
      selectPlaceholder="Selecione uma config"
      title="Configs"
    />
  );
}
