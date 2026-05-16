import { DataTablePagination } from "@components/DataTablePagination";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("DataTablePagination", () => {
  it("renders page state and emits page changes", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTablePagination
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
        page={2}
        pageSize={10}
        totalItems={95}
      />,
    );

    expect(screen.getByText("Page 2 of 10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pagina anterior" }));
    await user.click(screen.getByRole("button", { name: "Proxima pagina" }));
    await user.click(screen.getByRole("button", { name: "Ultima pagina" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 10);
  });

  it("clamps the current page and emits page size changes", async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTablePagination
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
        page={10}
        pageSize={20}
        pageSizeOptions={[10, 20, 50]}
        totalItems={35}
      />,
    );

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proxima pagina" })).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox"), "50");

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("renders leading, middle and trailing ellipsis page ranges", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTablePagination
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
        page={1}
        pageSize={10}
        totalItems={95}
      />,
    );

    expect(screen.getByRole("button", { name: "Primeira pagina" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Ir para pagina 4/ }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    rerender(
      <DataTablePagination
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
        page={5}
        pageSize={10}
        totalItems={95}
      />,
    );
    expect(screen.getAllByText("...")).toHaveLength(2);

    rerender(
      <DataTablePagination
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
        page={10}
        pageSize={10}
        totalItems={95}
      />,
    );
    expect(screen.getByRole("button", { name: "Ultima pagina" })).toBeDisabled();
    expect(screen.getAllByText("...")).toHaveLength(1);
  });
});
