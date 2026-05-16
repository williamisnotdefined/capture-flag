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
import { Link, useLocation } from "react-router-dom";
import {
  auditLogsPath,
  configsPath,
  environmentsPath,
  flagsPath,
  organizationPath,
  projectsPath,
  sdkKeysPath,
  segmentsPath,
} from "./routePaths";
import { useProjectResourcesRouteContext } from "./useRouteContext";

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

type SidebarItemProps = {
  disabled?: boolean;
  icon: IconName;
  isActive: boolean;
  label: string;
  path: string;
};

type AppSidebarProps = {
  isLogoutPending: boolean;
  onLogout: () => void;
  user: {
    email: string | null;
    name: string;
  };
};

export function AppSidebar({ isLogoutPending, onLogout, user }: AppSidebarProps) {
  const location = useLocation();
  const { selectedConfigId, selectedEnvironmentId, selectedOrganizationId, selectedProjectId } =
    useProjectResourcesRouteContext();
  const activeSection = getActiveSection(location.pathname);

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
          <SidebarItem
            icon="organizations"
            isActive={activeSection === "organizations"}
            label="Organizacoes"
            path={organizationPath(selectedOrganizationId)}
          />
          <SidebarItem
            disabled={!selectedOrganizationId}
            icon="projects"
            isActive={activeSection === "projects"}
            label="Projetos"
            path={projectsPath(selectedOrganizationId, selectedProjectId)}
          />
          <SidebarItem
            disabled={!selectedProjectId}
            icon="environments"
            isActive={activeSection === "environments"}
            label="Environments"
            path={environmentsPath(selectedOrganizationId, selectedProjectId)}
          />
          <SidebarItem
            disabled={!selectedProjectId}
            icon="configs"
            isActive={activeSection === "configs"}
            label="Configs"
            path={configsPath(selectedOrganizationId, selectedProjectId, selectedConfigId)}
          />
          <SidebarItem
            disabled={!selectedConfigId}
            icon="flags"
            isActive={activeSection === "flags"}
            label="Flags"
            path={flagsPath(selectedOrganizationId, selectedProjectId, selectedConfigId)}
          />
          <SidebarItem
            disabled={!selectedConfigId}
            icon="segments"
            isActive={activeSection === "segments"}
            label="Segments"
            path={segmentsPath(selectedOrganizationId, selectedProjectId, selectedConfigId)}
          />
          <SidebarItem
            disabled={!selectedProjectId}
            icon="sdkKeys"
            isActive={activeSection === "sdkKeys"}
            label="SDK Keys"
            path={sdkKeysPath(
              selectedOrganizationId,
              selectedProjectId,
              selectedConfigId,
              selectedEnvironmentId,
            )}
          />
          <SidebarItem
            disabled={!selectedOrganizationId}
            icon="audit"
            isActive={activeSection === "audit"}
            label="Audit Logs"
            path={auditLogsPath(selectedOrganizationId, selectedProjectId)}
          />
        </nav>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:mt-auto">
          <div className="min-w-0 text-sm">
            <span className="block truncate font-bold tracking-tight text-white">{user.name}</span>
            {user.email ? (
              <span className="block truncate text-xs text-slate-400">{user.email}</span>
            ) : null}
          </div>
          <button
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 font-bold text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isLogoutPending}
            onClick={onLogout}
            type="button"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ disabled = false, icon, isActive, label, path }: SidebarItemProps) {
  const className = cls(
    "inline-flex min-w-max items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition lg:min-w-0",
    {
      "bg-white text-slate-950 shadow-lg shadow-black/20": isActive && !disabled,
      "text-slate-400 opacity-60": disabled,
      "text-slate-200 hover:bg-white/10 hover:text-white": !isActive && !disabled,
    },
  );

  if (disabled) {
    return (
      <span className={className}>
        <Icon name={icon} />
        {label}
      </span>
    );
  }

  return (
    <Link className={className} to={path}>
      <Icon name={icon} />
      {label}
    </Link>
  );
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
