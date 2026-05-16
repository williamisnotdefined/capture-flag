import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import cls from "classnames";
import { MoreHorizontal } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ActionMenuProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function ActionMenu({ children, className, label = "Acoes" }: ActionMenuProps) {
  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className={cls(
            "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-muted",
            className,
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          className="z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          sideOffset={4}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

type ActionMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  destructive?: boolean;
};

export function ActionMenuItem({ className, destructive = false, ...props }: ActionMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cls(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        { "text-destructive focus:text-destructive": destructive },
        className,
      )}
      {...props}
    />
  );
}

type ActionMenuLinkProps = LinkProps & {
  destructive?: boolean;
};

export function ActionMenuLink({ className, destructive = false, ...props }: ActionMenuLinkProps) {
  return (
    <DropdownMenuPrimitive.Item asChild>
      <Link
        className={cls(
          "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
          { "text-destructive focus:text-destructive": destructive },
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Item>
  );
}
