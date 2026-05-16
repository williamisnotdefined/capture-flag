import cls from "classnames";
import { Building2, Folder, type LucideIcon, Server, Settings2 } from "lucide-react";
import { formatResourceLabel } from "../../core/strings/formatResourceLabel";
import { useProjectResourcesRouteContext } from "../../routing/useRouteContext";
import { SidebarTrigger } from "./SidebarShell";

type TopHeaderProps = {
  onToggleSidebar: () => void;
};

type TopHeaderItemProps = {
  icon: LucideIcon;
  label: string;
  resource?: { key?: string; name: string } | null;
  value: string;
};

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const { selectedConfig, selectedEnvironment, selectedOrganization, selectedProject } =
    useProjectResourcesRouteContext();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-10 min-w-0 items-center gap-2 px-3 lg:px-6">
        <SidebarTrigger className="md:hidden" onToggle={onToggleSidebar} />
        <div
          aria-label="Contexto atual"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-xs"
        >
          <TopHeaderItem
            icon={Building2}
            label="Organizacao"
            resource={selectedOrganization}
            value={selectedOrganization?.name ?? "Sem organizacao"}
          />
          <TopHeaderSeparator />
          <TopHeaderItem
            icon={Folder}
            label="Projeto"
            resource={selectedProject}
            value={selectedProject?.name ?? "Sem projeto"}
          />
          <TopHeaderSeparator />
          <TopHeaderItem
            icon={Settings2}
            label="Config"
            resource={selectedConfig}
            value={selectedConfig?.name ?? "Sem config"}
          />
          <TopHeaderSeparator />
          <TopHeaderItem
            icon={Server}
            label="Environment"
            resource={selectedEnvironment}
            value={selectedEnvironment?.name ?? "Sem environment"}
          />
        </div>
      </div>
    </header>
  );
}

function TopHeaderItem({ icon: IconComponent, label, resource, value }: TopHeaderItemProps) {
  const title = resource ? `${label}: ${formatResourceLabel(resource)}` : `${label}: ${value}`;
  const isMissing = !resource;

  return (
    <div
      aria-label={title}
      className={cls(
        "inline-flex h-7 max-w-[12rem] shrink-0 items-center gap-1.5 rounded-md px-2",
        {
          "text-foreground": !isMissing,
          "text-muted-foreground": isMissing,
        },
      )}
      title={title}
    >
      <IconComponent
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function TopHeaderSeparator() {
  return (
    <span aria-hidden="true" className="shrink-0 text-muted-foreground/35">
      /
    </span>
  );
}
