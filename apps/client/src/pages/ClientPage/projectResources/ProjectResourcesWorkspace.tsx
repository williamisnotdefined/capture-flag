import { useGetProjectConfigs } from "../../../api/configs";
import { useGetProjectEnvironments } from "../../../api/environments";
import { ConfigsPanel } from "./ConfigsPanel";
import { EnvironmentsPanel } from "./EnvironmentsPanel";
import { SdkKeysSection } from "./SdkKeysSection";
import { FeatureFlagsPanel } from "./featureFlags/FeatureFlagsPanel";
import { useSelectedResourceId } from "./useSelectedResourceId";

type ProjectResourcesWorkspaceProps = {
  canManageFeatureFlags: boolean;
  canManageProjectResources: boolean;
  selectedProjectId: string;
};

export function ProjectResourcesWorkspace({
  canManageFeatureFlags,
  canManageProjectResources,
  selectedProjectId,
}: ProjectResourcesWorkspaceProps) {
  const configsQuery = useGetProjectConfigs(selectedProjectId);
  const environmentsQuery = useGetProjectEnvironments(selectedProjectId);
  const configs = configsQuery.data ?? [];
  const environments = environmentsQuery.data ?? [];
  const [selectedConfigId, setSelectedConfigId] = useSelectedResourceId(configs);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useSelectedResourceId(environments);
  const selectedConfig = configs.find((config) => config.id === selectedConfigId);
  const selectedEnvironment = environments.find(
    (environment) => environment.id === selectedEnvironmentId,
  );
  const activeConfigId = selectedConfig?.id ?? "";
  const activeEnvironmentId = selectedEnvironment?.id ?? "";

  return (
    <>
      <ConfigsPanel
        canManageProjectResources={canManageProjectResources}
        configs={configs}
        onSelect={setSelectedConfigId}
        queryError={configsQuery.error}
        selectedConfigId={activeConfigId}
        selectedProjectId={selectedProjectId}
      />

      <EnvironmentsPanel
        canManageProjectResources={canManageProjectResources}
        environments={environments}
        onSelect={setSelectedEnvironmentId}
        queryError={environmentsQuery.error}
        selectedEnvironmentId={activeEnvironmentId}
        selectedProjectId={selectedProjectId}
      />

      <FeatureFlagsPanel
        canManageFeatureFlags={canManageFeatureFlags}
        configId={activeConfigId}
        environmentId={activeEnvironmentId}
        environmentName={selectedEnvironment?.name}
      />

      <SdkKeysSection
        canManageProjectResources={canManageProjectResources}
        key={`${selectedProjectId}:${activeConfigId}:${activeEnvironmentId}`}
        selectedConfig={selectedConfig}
        selectedEnvironment={selectedEnvironment}
        selectedProjectId={selectedProjectId}
      />
    </>
  );
}
