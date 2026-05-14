import { Eyebrow, SelectInput } from "../../../components";
import type { Config, Environment } from "../../../types";
import { ConfigPreviewPanel } from "./ConfigPreviewPanel";
import { useGetProjectConfigs } from "../../../api/configs";
import { useGetProjectEnvironments } from "../../../api/environments";
import { ConfigsPanel } from "./ConfigsPanel";
import { EnvironmentsPanel } from "./EnvironmentsPanel";
import { SdkKeysSection } from "./SdkKeysSection";
import { FeatureFlagsPanel } from "./featureFlags/FeatureFlagsPanel";
import { SegmentsPanel } from "./segments/SegmentsPanel";
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
      <ResourceContextBar
        configs={configs}
        environments={environments}
        onSelectConfig={setSelectedConfigId}
        onSelectEnvironment={setSelectedEnvironmentId}
        selectedConfigId={activeConfigId}
        selectedEnvironmentId={activeEnvironmentId}
      />

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
        environments={environments}
        onSelectEnvironment={setSelectedEnvironmentId}
      />

      <ConfigPreviewPanel
        selectedConfig={selectedConfig}
        selectedEnvironment={selectedEnvironment}
      />

      <SegmentsPanel canManageSegments={canManageFeatureFlags} configId={activeConfigId} />

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

type ResourceContextBarProps = {
  configs: Config[];
  environments: Environment[];
  selectedConfigId: string;
  selectedEnvironmentId: string;
  onSelectConfig: (configId: string) => void;
  onSelectEnvironment: (environmentId: string) => void;
};

function ResourceContextBar({
  configs,
  environments,
  selectedConfigId,
  selectedEnvironmentId,
  onSelectConfig,
  onSelectEnvironment,
}: ResourceContextBarProps) {
  return (
    <section className="rounded-3xl bg-slate-900 p-4 text-white shadow-sm lg:col-span-2">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <Eyebrow>Config switcher</Eyebrow>
          <SelectInput
            className="mt-2 w-full bg-white text-slate-900"
            disabled={configs.length === 0}
            onChange={(event) => onSelectConfig(event.target.value)}
            value={selectedConfigId}
          >
            <option value="">Selecione uma config</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {resourceLabel(config)}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <Eyebrow>Environment switcher</Eyebrow>
          <SelectInput
            className="mt-2 w-full bg-white text-slate-900"
            disabled={environments.length === 0}
            onChange={(event) => onSelectEnvironment(event.target.value)}
            value={selectedEnvironmentId}
          >
            <option value="">Selecione um ambiente</option>
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {resourceLabel(environment)}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
    </section>
  );
}

function resourceLabel(resource: { key: string; name: string }) {
  return `${resource.name} (${resource.key})`;
}
