import { auditLogsPath, flagsPath, sdkKeysPath, segmentsPath } from "@routing/routePaths";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import cls from "classnames";
import { Boxes, Flag, KeyRound, type LucideIcon, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ContextSelectors } from "./ContextSelectors";
import { DesktopSidebar, MobileSidebarSheet, SidebarTooltip } from "./SidebarShell";
import { SidebarUserFooter } from "./SidebarUserFooter";

type NavigationSection =
  | "audit"
  | "configs"
  | "environments"
  | "flags"
  | "organizations"
  | "projects"
  | "sdkKeys"
  | "segments";

type IconName = "audit" | "flags" | "sdkKeys" | "segments";

type SidebarItemProps = {
  collapsed: boolean;
  disabled?: boolean;
  icon: IconName;
  isActive: boolean;
  label: string;
  onNavigate?: () => void;
  path: string;
};

type AppSidebarProps = {
  desktopOpen: boolean;
  isLogoutPending: boolean;
  mobileOpen: boolean;
  onLogout: () => void;
  onMobileOpenChange: (open: boolean) => void;
  onToggleSidebar: () => void;
  user: {
    email: string | null;
    name: string;
  };
};

type SidebarContentProps = {
  activeSection: NavigationSection;
  collapsed: boolean;
  isLogoutPending: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  selectedConfigId: string;
  selectedEnvironmentId: string;
  selectedOrganizationId: string;
  selectedProjectId: string;
  user: AppSidebarProps["user"];
};

export function AppSidebar({
  desktopOpen,
  isLogoutPending,
  mobileOpen,
  onLogout,
  onMobileOpenChange,
  onToggleSidebar,
  user,
}: AppSidebarProps) {
  const location = useLocation();
  const { selectedConfigId, selectedEnvironmentId, selectedOrganizationId, selectedProjectId } =
    useProjectResourcesRouteContext();
  const activeSection = getActiveSection(location.pathname);
  const sidebarContentProps = {
    activeSection,
    isLogoutPending,
    onLogout,
    selectedConfigId,
    selectedEnvironmentId,
    selectedOrganizationId,
    selectedProjectId,
    user,
  };

  return (
    <>
      <DesktopSidebar onToggle={onToggleSidebar} open={desktopOpen}>
        <SidebarContent {...sidebarContentProps} collapsed={!desktopOpen} />
      </DesktopSidebar>
      <MobileSidebarSheet onOpenChange={onMobileOpenChange} open={mobileOpen}>
        <SidebarContent
          {...sidebarContentProps}
          collapsed={false}
          onNavigate={() => onMobileOpenChange(false)}
        />
      </MobileSidebarSheet>
    </>
  );
}

function SidebarContent({
  activeSection,
  collapsed,
  isLogoutPending,
  onLogout,
  onNavigate,
  selectedConfigId,
  selectedEnvironmentId,
  selectedOrganizationId,
  selectedProjectId,
  user,
}: SidebarContentProps) {
  return (
    <>
      <header className="p-2">
        <div
          className={cls("flex h-12 items-center rounded-md text-sm", {
            "gap-2 px-2": !collapsed,
            "justify-center px-0": collapsed,
          })}
        >
          <img alt="Capture Flag" className="h-8 w-8 shrink-0 object-contain" src="/logo.png" />
          <div
            className={cls("grid min-w-0 flex-1 text-left leading-tight", { hidden: collapsed })}
          >
            <strong className="truncate font-semibold">Capture Flag</strong>
            <span className="truncate text-xs text-muted-foreground">Feature management</span>
          </div>
        </div>
      </header>

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-2 pt-0">
        <SidebarGroup collapsed={collapsed} title="Workspace">
          <ContextSelectors
            activeSection={activeSection}
            collapsed={collapsed}
            onNavigate={onNavigate}
            scope="workspace"
          />
        </SidebarGroup>

        <SidebarGroup collapsed={collapsed} title="Project">
          <ContextSelectors
            activeSection={activeSection}
            collapsed={collapsed}
            onNavigate={onNavigate}
            scope="project"
          />
          <SidebarItem
            collapsed={collapsed}
            disabled={!selectedConfigId}
            icon="flags"
            isActive={activeSection === "flags"}
            label="Flags"
            onNavigate={onNavigate}
            path={flagsPath(selectedOrganizationId, selectedProjectId, selectedConfigId)}
          />
          <SidebarItem
            collapsed={collapsed}
            disabled={!selectedConfigId}
            icon="segments"
            isActive={activeSection === "segments"}
            label="Segments"
            onNavigate={onNavigate}
            path={segmentsPath(selectedOrganizationId, selectedProjectId, selectedConfigId)}
          />
          <SidebarItem
            collapsed={collapsed}
            disabled={!selectedProjectId}
            icon="sdkKeys"
            isActive={activeSection === "sdkKeys"}
            label="SDK Keys"
            onNavigate={onNavigate}
            path={sdkKeysPath(
              selectedOrganizationId,
              selectedProjectId,
              selectedConfigId,
              selectedEnvironmentId,
            )}
          />
        </SidebarGroup>

        <SidebarGroup collapsed={collapsed} title="Observability">
          <SidebarItem
            collapsed={collapsed}
            disabled={!selectedOrganizationId}
            icon="audit"
            isActive={activeSection === "audit"}
            label="Audit Logs"
            onNavigate={onNavigate}
            path={auditLogsPath(selectedOrganizationId, selectedProjectId)}
          />
        </SidebarGroup>
      </nav>

      <SidebarUserFooter
        collapsed={collapsed}
        isLogoutPending={isLogoutPending}
        onLogout={onLogout}
        onNavigate={onNavigate}
        user={user}
      />
    </>
  );
}

function SidebarGroup({
  children,
  collapsed,
  title,
}: {
  children: ReactNode;
  collapsed: boolean;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2
        className={cls(
          "flex h-8 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 transition-[margin,opacity] duration-200",
          { "pointer-events-none -mt-8 opacity-0": collapsed },
        )}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function SidebarItem({
  collapsed,
  disabled = false,
  icon,
  isActive,
  label,
  onNavigate,
  path,
}: SidebarItemProps) {
  const className = cls(
    "inline-flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm no-underline outline-none ring-sidebar-ring transition-[width,color,background-color] focus-visible:ring-2",
    {
      "w-8 justify-center": collapsed,
      "w-full": !collapsed,
      "bg-sidebar-accent font-medium text-sidebar-accent-foreground": isActive && !disabled,
      "text-sidebar-foreground/40 opacity-60": disabled,
      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground":
        !isActive && !disabled,
    },
  );
  const content = (
    <>
      <Icon name={icon} />
      <span className={cls("truncate", { "sr-only": collapsed })}>{label}</span>
    </>
  );

  if (disabled) {
    return (
      <SidebarTooltip enabled={collapsed} label={label}>
        <span aria-disabled="true" className={className}>
          {content}
        </span>
      </SidebarTooltip>
    );
  }

  return (
    <SidebarTooltip enabled={collapsed} label={label}>
      <Link className={className} onClick={onNavigate} to={path}>
        {content}
      </Link>
    </SidebarTooltip>
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

  return <IconComponent aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />;
}

const iconComponents: Record<IconName, LucideIcon> = {
  audit: ScrollText,
  flags: Flag,
  sdkKeys: KeyRound,
  segments: Boxes,
};
