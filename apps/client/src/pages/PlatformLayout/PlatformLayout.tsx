import cls from "classnames";
import {
  Boxes,
  Building2,
  Flag,
  Folder,
  KeyRound,
  type LucideIcon,
  ScrollText,
  Server,
  Settings2,
} from "lucide-react";
import { useId } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { Button, Eyebrow, SelectInput } from "../../components";
import { Shell } from "../../components/Shell";
import {
  auditLogsPath,
  configSearchParam,
  configsPath,
  environmentSearchParam,
  environmentsPath,
  flagsPath,
  organizationPath,
  projectSearchParam,
  projectsPath,
  sdkKeysPath,
  segmentsPath,
  setSearchValue,
  withSearch,
} from "./routePaths";
import { useProjectResourcesRouteContext } from "./useRouteContext";

type NavigationItem = {
  disabled?: boolean;
  icon: IconName;
  key: NavigationSection;
  label: string;
  path: string;
};

type NavigationSection =
  | "audit"
  | "configs"
  | "environments"
  | "flags"
  | "organizations"
  | "projects"
  | "sdkKeys"
  | "segments";

type IconName =
  | "audit"
  | "configs"
  | "environments"
  | "flags"
  | "organizations"
  | "projects"
  | "sdkKeys"
  | "segments";

export function PlatformLayout() {
  const navigate = useNavigate();
  const meQuery = useGetMe();
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate("/login");
    },
  });

  if (meQuery.isLoading) {
    return <Shell title="Capture Flag">Carregando sessao...</Shell>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  const me = meQuery.data;
  if (!me) {
    return <Shell title="Capture Flag">Sessao indisponivel.</Shell>;
  }

  return (
    <div className="min-h-screen bg-[#f4f0e8] lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-[#e3d8c7] bg-[#f4f0e8]/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>Workspace</Eyebrow>
                <strong className="text-slate-900">Capture Flag</strong>
              </div>
              <Button
                className="px-3 py-2 xl:hidden"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Sair
              </Button>
            </div>
            <ContextSelectors />
            <div className="hidden items-center gap-3 xl:flex">
              <div className="text-right text-sm">
                <span className="block font-bold text-slate-900">{me.user.name}</span>
                {me.user.email ? (
                  <span className="block text-xs text-stone-600">{me.user.email}</span>
                ) : null}
              </div>
              <Button
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Sair
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1360px] px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppSidebar() {
  const location = useLocation();
  const { selectedConfigId, selectedEnvironmentId, selectedOrganizationId, selectedProjectId } =
    useProjectResourcesRouteContext();
  const activeSection = getActiveSection(location.pathname);
  const navigationItems = buildNavigationItems({
    configId: selectedConfigId,
    environmentId: selectedEnvironmentId,
    organizationId: selectedOrganizationId,
    projectId: selectedProjectId,
  });

  return (
    <aside className="border-b border-slate-900/10 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-3 rounded-3xl bg-white/5 p-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 font-black text-white">
            CF
          </div>
          <div>
            <strong className="block tracking-tight">Capture Flag</strong>
            <span className="text-xs text-slate-400">Feature management</span>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
          {navigationItems.map((item) => (
            <SidebarItem isActive={activeSection === item.key} item={item} key={item.key} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SidebarItem({ isActive, item }: { isActive: boolean; item: NavigationItem }) {
  const className = cls(
    "inline-flex min-w-max items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition lg:min-w-0",
    {
      "bg-white text-slate-950 shadow-lg shadow-black/20": isActive && !item.disabled,
      "text-slate-400 opacity-60": item.disabled,
      "text-slate-200 hover:bg-white/10 hover:text-white": !isActive && !item.disabled,
    },
  );

  if (item.disabled) {
    return (
      <span className={className}>
        <Icon name={item.icon} />
        {item.label}
      </span>
    );
  }

  return (
    <Link className={className} to={item.path}>
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );
}

function ContextSelectors() {
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

type ContextSelectProps<TItem extends { id: string; key?: string; name: string }> = {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: TItem[];
  placeholder: string;
  value: string;
};

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
      className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-stone-600"
      htmlFor={selectId}
    >
      {label}
      <SelectInput
        className="min-w-0 bg-white/90 py-2 text-sm normal-case tracking-normal"
        disabled={disabled}
        id={selectId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {resourceLabel(option)}
          </option>
        ))}
      </SelectInput>
    </label>
  );
}

function buildNavigationItems({
  configId,
  environmentId,
  organizationId,
  projectId,
}: {
  configId: string;
  environmentId: string;
  organizationId: string;
  projectId: string;
}): NavigationItem[] {
  return [
    {
      icon: "organizations",
      key: "organizations",
      label: "Organizacoes",
      path: organizationPath(organizationId),
    },
    {
      disabled: !organizationId,
      icon: "projects",
      key: "projects",
      label: "Projetos",
      path: projectsPath(organizationId, projectId),
    },
    {
      disabled: !projectId,
      icon: "environments",
      key: "environments",
      label: "Environments",
      path: environmentsPath(organizationId, projectId),
    },
    {
      disabled: !projectId,
      icon: "configs",
      key: "configs",
      label: "Configs",
      path: configsPath(organizationId, projectId, configId),
    },
    {
      disabled: !configId,
      icon: "flags",
      key: "flags",
      label: "Flags",
      path: flagsPath(organizationId, projectId, configId),
    },
    {
      disabled: !configId,
      icon: "segments",
      key: "segments",
      label: "Segments",
      path: segmentsPath(organizationId, projectId, configId),
    },
    {
      disabled: !projectId,
      icon: "sdkKeys",
      key: "sdkKeys",
      label: "SDK Keys",
      path: sdkKeysPath(organizationId, projectId, configId, environmentId),
    },
    {
      disabled: !organizationId,
      icon: "audit",
      key: "audit",
      label: "Audit Logs",
      path: auditLogsPath(organizationId, projectId),
    },
  ];
}

function getActiveSection(pathname: string): NavigationSection {
  if (pathname.endsWith("/audit-logs")) {
    return "audit";
  }

  if (pathname.endsWith("/sdk-keys")) {
    return "sdkKeys";
  }

  if (pathname.endsWith("/environments")) {
    return "environments";
  }

  if (pathname.endsWith("/flags")) {
    return "flags";
  }

  if (pathname.endsWith("/segments")) {
    return "segments";
  }

  if (pathname.includes("/configs")) {
    return "configs";
  }

  if (pathname.includes("/projects")) {
    return "projects";
  }

  return "organizations";
}

function resourceLabel(resource: { key?: string; name: string }) {
  return resource.key ? `${resource.name} (${resource.key})` : resource.name;
}

function Icon({ name }: { name: IconName }) {
  const IconComponent = iconComponents[name];

  return <IconComponent aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />;
}

const iconComponents: Record<IconName, LucideIcon> = {
  audit: ScrollText,
  configs: Settings2,
  environments: Server,
  flags: Flag,
  organizations: Building2,
  projects: Folder,
  sdkKeys: KeyRound,
  segments: Boxes,
};
