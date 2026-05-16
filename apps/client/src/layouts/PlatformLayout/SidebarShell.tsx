import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import cls from "classnames";
import { PanelLeft } from "lucide-react";
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import type { SidebarPanelState } from "./useSidebarState";

const sidebarShellStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
  "--sidebar-width-mobile": "18rem",
} as CSSProperties;

type SidebarFrameProps = {
  children: ReactNode;
  panelState: SidebarPanelState;
};

export function SidebarFrame({ children, panelState }: SidebarFrameProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <div
        className="flex min-h-svh w-full bg-background text-foreground"
        data-sidebar-state={panelState}
        style={sidebarShellStyle}
      >
        {children}
      </div>
    </TooltipPrimitive.Provider>
  );
}

type DesktopSidebarProps = {
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
};

export function DesktopSidebar({ children, open, onToggle }: DesktopSidebarProps) {
  return (
    <div
      className="group/sidebar peer hidden text-sidebar-foreground md:block"
      data-collapsible={open ? "" : "icon"}
      data-side="left"
      data-state={open ? "expanded" : "collapsed"}
      data-slot="sidebar"
    >
      <div
        className={cls(
          "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
          { "w-[var(--sidebar-width-icon)]": !open },
        )}
        data-slot="sidebar-gap"
      />
      <div
        className={cls(
          "fixed inset-y-0 left-0 z-30 hidden h-svh w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear md:flex",
          { "w-[var(--sidebar-width-icon)]": !open },
        )}
        data-slot="sidebar-container"
      >
        <div
          className="relative flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar"
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
        >
          {children}
          <SidebarRail collapsed={!open} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}

type SidebarRailProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function SidebarRail({ collapsed, onToggle }: SidebarRailProps) {
  return (
    <button
      aria-label="Alternar sidebar"
      className={cls(
        "absolute inset-y-0 right-[-0.5rem] z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-sidebar-border md:flex",
        {
          "cursor-e-resize": collapsed,
          "cursor-w-resize": !collapsed,
        },
      )}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={onToggle}
      tabIndex={-1}
      title="Alternar sidebar"
      type="button"
    />
  );
}

type MobileSidebarSheetProps = {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileSidebarSheet({ children, onOpenChange, open }: MobileSidebarSheetProps) {
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-svh w-[var(--sidebar-width-mobile)] flex-col border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-lg outline-none md:hidden">
          <DialogPrimitive.Title className="sr-only">Sidebar</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navegacao principal do Capture Flag.
          </DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SidebarInset({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cls("relative flex min-w-0 flex-1 flex-col bg-background", className)}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

type SidebarTriggerProps = ComponentPropsWithoutRef<"button"> & {
  onToggle: () => void;
};

export function SidebarTrigger({ className, onClick, onToggle, ...props }: SidebarTriggerProps) {
  return (
    <button
      aria-label="Alternar sidebar"
      className={cls(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event) => {
        onClick?.(event);
        onToggle();
      }}
      type="button"
      {...props}
    >
      <PanelLeft aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Alternar sidebar</span>
    </button>
  );
}

type SidebarTooltipProps = {
  children: ReactNode;
  enabled: boolean;
  label: string;
};

export function SidebarTooltip({ children, enabled, label }: SidebarTooltipProps) {
  if (!enabled) {
    return children;
  }

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          align="center"
          className="z-50 rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
          side="right"
          sideOffset={8}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
