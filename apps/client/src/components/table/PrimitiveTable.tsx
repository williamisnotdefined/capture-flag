import cls from "classnames";
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent } from "react";

export function PrimitiveTable({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="relative w-full overflow-x-auto" data-slot="table-container">
      <table
        className={cls("w-full caption-bottom text-sm", className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

export function PrimitiveTableHeader({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead className={cls("[&_tr]:border-b", className)} data-slot="table-header" {...props} />
  );
}

export function PrimitiveTableBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody
      className={cls("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

export function PrimitiveTableFooter({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      className={cls("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      data-slot="table-footer"
      {...props}
    />
  );
}

export function PrimitiveTableRow({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cls(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

type PrimitiveClickableTableRowProps = ComponentPropsWithoutRef<"tr"> & {
  activationRole?: "button" | "link";
  onActivate: () => void;
};

export function PrimitiveClickableTableRow({
  activationRole = "button",
  className,
  onActivate,
  onClick,
  onKeyDown,
  ...props
}: PrimitiveClickableTableRowProps) {
  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) {
      onActivate();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <PrimitiveTableRow
      className={cls(
        "cursor-pointer outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={activationRole}
      tabIndex={0}
      {...props}
    />
  );
}

export function PrimitiveTableHead({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cls(
        "h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground",
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

export function PrimitiveTableCell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={cls("px-3 py-2 align-middle whitespace-nowrap", className)}
      data-slot="table-cell"
      {...props}
    />
  );
}

export function PrimitiveTableCaption({
  className,
  ...props
}: ComponentPropsWithoutRef<"caption">) {
  return (
    <caption
      className={cls("mt-4 text-sm text-muted-foreground", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}
