import { useId } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SelectInput } from "../../components";
import { formatResourceLabel } from "../../core/strings/formatResourceLabel";
import {
  configSearchParam,
  configsPath,
  environmentSearchParam,
  flagsPath,
  organizationPath,
  projectSearchParam,
  projectsPath,
  segmentsPath,
  setSearchValue,
  withSearch,
} from "./routePaths";
import { useProjectResourcesRouteContext } from "./useRouteContext";

type ContextSelectProps<TItem extends { id: string; key?: string; name: string }> = {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: TItem[];
  placeholder: string;
  value: string;
};

export function ContextSelectors() {
  const navigate = useNavigate();
  const location = useLocation();
  const { configId: routeConfigId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    configs,
    environments,
    organizations,
    projects,
    selectedConfigId,
    selectedEnvironmentId,
    selectedOrganizationId,
    selectedProjectId,
  } = useProjectResourcesRouteContext();

  function selectOrganization(organizationId: string) {
    navigate(organizationPath(organizationId));
  }

  function selectProject(projectId: string) {
    if (location.pathname.endsWith("/audit-logs")) {
      setSearchParams(setSearchValue(searchParams, projectSearchParam, projectId));
      return;
    }

    navigate(projectsPath(selectedOrganizationId, projectId));
  }

  function selectConfig(configId: string) {
    if (location.pathname.endsWith("/sdk-keys")) {
      setSearchParams(setSearchValue(searchParams, configSearchParam, configId));
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(configSearchParam);

    if (location.pathname.endsWith("/flags")) {
      navigate(
        withSearch(
          flagsPath(selectedOrganizationId, selectedProjectId, configId),
          nextSearchParams,
        ),
      );
      return;
    }

    if (location.pathname.endsWith("/segments")) {
      navigate(
        withSearch(
          segmentsPath(selectedOrganizationId, selectedProjectId, configId),
          nextSearchParams,
        ),
      );
      return;
    }

    navigate(
      withSearch(
        configsPath(selectedOrganizationId, selectedProjectId, configId),
        nextSearchParams,
      ),
    );
  }

  function selectEnvironment(environmentId: string) {
    setSearchParams(setSearchValue(searchParams, environmentSearchParam, environmentId));
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <ContextSelect
        disabled={organizations.length === 0}
        label="Organizacao"
        onChange={selectOrganization}
        options={organizations}
        placeholder="Sem organizacoes"
        value={selectedOrganizationId}
      />
      <ContextSelect
        disabled={!selectedOrganizationId || projects.length === 0}
        label="Projeto"
        onChange={selectProject}
        options={projects}
        placeholder="Sem projetos"
        value={selectedProjectId}
      />
      <ContextSelect
        disabled={!selectedProjectId || configs.length === 0}
        label="Config"
        onChange={selectConfig}
        options={configs}
        placeholder="Sem configs"
        value={selectedConfigId || routeConfigId}
      />
      <ContextSelect
        disabled={!selectedProjectId || environments.length === 0}
        label="Environment"
        onChange={selectEnvironment}
        options={environments}
        placeholder="Sem environments"
        value={selectedEnvironmentId}
      />
    </div>
  );
}

function ContextSelect<TItem extends { id: string; key?: string; name: string }>({
  disabled,
  label,
  onChange,
  options,
  placeholder,
  value,
}: ContextSelectProps<TItem>) {
  const selectId = useId();

  return (
    <label
      className="grid gap-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
      htmlFor={selectId}
    >
      {label}
      <SelectInput
        className="h-8 min-w-0 bg-background text-sm normal-case tracking-normal"
        disabled={disabled}
        id={selectId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {formatResourceLabel(option)}
          </option>
        ))}
      </SelectInput>
    </label>
  );
}
