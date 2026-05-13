import { useCreateEnvironment } from "../../../api/environments";
import type { Environment } from "../../../types";
import { ResourcePanel } from "./ResourcePanel";

type EnvironmentsPanelProps = {
  canManageProjectResources: boolean;
  environments: Environment[];
  onSelect: (environmentId: string) => void;
  queryError: unknown;
  selectedEnvironmentId: string;
  selectedProjectId: string;
};

export function EnvironmentsPanel({
  canManageProjectResources,
  environments,
  onSelect,
  queryError,
  selectedEnvironmentId,
  selectedProjectId,
}: EnvironmentsPanelProps) {
  const createEnvironmentMutation = useCreateEnvironment({ projectId: selectedProjectId });

  return (
    <ResourcePanel
      create={{
        disabled:
          !selectedProjectId || !canManageProjectResources || createEnvironmentMutation.isPending,
        error: createEnvironmentMutation.error,
        onSubmit: createEnvironmentMutation.mutateAsync,
        placeholder: "production",
      }}
      emptyMessage="Sem ambientes"
      items={environments}
      onSelect={onSelect}
      permissionHint={
        !canManageProjectResources
          ? "Voce nao tem permissao para criar ambientes neste projeto."
          : undefined
      }
      queryError={queryError}
      selectedId={selectedEnvironmentId}
      selectPlaceholder="Selecione um ambiente"
      title="Ambientes"
    />
  );
}
