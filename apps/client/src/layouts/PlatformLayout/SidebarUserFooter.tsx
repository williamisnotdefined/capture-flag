import cls from "classnames";
import { LogOut } from "lucide-react";
import { SidebarTooltip } from "./SidebarShell";

type SidebarUserFooterProps = {
  collapsed: boolean;
  isLogoutPending: boolean;
  onLogout: () => void;
  user: {
    email: string | null;
    name: string;
  };
};

export function SidebarUserFooter({
  collapsed,
  isLogoutPending,
  onLogout,
  user,
}: SidebarUserFooterProps) {
  const userInitials = getUserInitials(user.name);

  return (
    <footer className="border-t border-sidebar-border p-2">
      <div
        className={cls("rounded-md", {
          "flex flex-col items-center gap-2 p-1": collapsed,
          "flex items-center gap-2 p-2": !collapsed,
        })}
      >
        <SidebarTooltip enabled={collapsed} label={user.name}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
            {userInitials}
          </div>
        </SidebarTooltip>
        <div
          className={cls("grid min-w-0 flex-1 text-left text-sm leading-tight", {
            hidden: collapsed,
          })}
        >
          <span className="truncate font-semibold">{user.name}</span>
          {user.email ? (
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          ) : null}
        </div>
        <SidebarTooltip enabled={collapsed} label="Sair">
          <button
            className={cls(
              "inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              {
                "w-8 px-0": collapsed,
                "px-2": !collapsed,
              },
            )}
            disabled={isLogoutPending}
            onClick={onLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span className={cls({ "sr-only": collapsed })}>Sair</span>
          </button>
        </SidebarTooltip>
      </div>
    </footer>
  );
}

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}
