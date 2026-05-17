import { MemberForm } from "@components/members/MemberForm";
import { MemberList } from "@components/members/MemberList";
import { MembersPanel } from "@components/members/MembersPanel";
import type { MemberListItem } from "@components/members/types";
import { renderWithProviders } from "@src/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const members: MemberListItem[] = [
  {
    id: "member_ana",
    role: "owner",
    user: { avatarUrl: null, email: "ana@example.com", id: "user_ana", name: "Ana" },
  },
  {
    id: "member_bruno",
    role: "viewer",
    user: { avatarUrl: null, email: null, id: "user_bruno", name: "Bruno" },
  },
];

describe("member components", () => {
  it("validates email targets and submits member invites", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <MemberForm
        disabled={false}
        isPending={false}
        onSubmit={onSubmit}
        roles={["admin", "member"]}
      />,
    );

    await user.type(screen.getByPlaceholderText("email do usuario"), "invalid");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByText("Informe um email valido.")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("email do usuario"));
    await user.type(screen.getByPlaceholderText("email do usuario"), "new@example.com");
    await user.selectOptions(screen.getByDisplayValue("admin"), "member");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: "new@example.com", role: "member" }),
    );
  });

  it("submits selected target users and disables empty target lists", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <MemberForm
        disabled={false}
        isPending={false}
        onSubmit={onSubmit}
        roles={["developer", "viewer"]}
        targetOptions={[{ description: "ana@example.com", label: "Ana", value: "user_ana" }]}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "user_ana");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "viewer");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ role: "viewer", userId: "user_ana" }),
    );

    rerender(
      <MemberForm
        disabled={false}
        isPending={false}
        onSubmit={onSubmit}
        roles={["developer"]}
        targetOptions={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });

  it("validates invalid target users and preserves values on submit error", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("failed");
    });
    const user = userEvent.setup();

    renderWithProviders(
      <MemberForm
        disabled={false}
        isPending={false}
        onSubmit={onSubmit}
        roles={["developer"]}
        targetOptions={[{ label: "Ana", value: "user_ana" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Selecione um usuario.")).toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "user_ana");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ role: "developer", userId: "user_ana" }),
    );
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("user_ana");
  });

  it("filters members, changes roles and removes members", async () => {
    const onBulkRemoveMembers = vi.fn();
    const onRoleChange = vi.fn();
    const onRemoveMember = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <MemberList
        emptyMessage="Sem membros"
        members={members}
        onBulkRemoveMembers={onBulkRemoveMembers}
        onRemoveMember={onRemoveMember}
        onRoleChange={onRoleChange}
        roles={["owner", "viewer", "developer"]}
      />,
    );

    await user.type(screen.getByLabelText("Filtrar membros"), "bruno");

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("sem email")).toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "developer");
    expect(onRoleChange).toHaveBeenCalledWith("member_bruno", "developer");

    await user.click(screen.getByRole("button", { name: "Acoes para Bruno" }));
    await user.click(await screen.findByText("Remover"));

    expect(onRemoveMember).toHaveBeenCalledWith("member_bruno");

    await user.click(screen.getByRole("checkbox", { name: "Selecionar Bruno" }));
    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(onBulkRemoveMembers).toHaveBeenCalledWith(["member_bruno"]);
  });

  it("renders empty and disabled member list states", () => {
    renderWithProviders(
      <MemberList
        disabled
        emptyMessage="Sem membros"
        members={[]}
        onRemoveMember={vi.fn()}
        onRoleChange={vi.fn()}
        roles={["viewer"]}
      />,
    );

    expect(screen.getByText("Sem membros")).toBeInTheDocument();
  });

  it("composes form, errors and list in MembersPanel", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <MembersPanel
        addError={new Error("Falha ao adicionar")}
        disabled={false}
        emptyMessage="Sem membros"
        isPending={false}
        managementError={new Error("Falha ao gerenciar")}
        members={members}
        onSubmit={onSubmit}
        permissionHint="Somente admin"
        queryError={new Error("Falha ao carregar")}
        roles={["owner", "viewer"]}
        title="Membros"
      />,
    );

    expect(screen.getByRole("heading", { name: "Membros" })).toBeInTheDocument();
    expect(screen.getByText("Falha ao carregar")).toBeInTheDocument();
    expect(screen.getByText("Falha ao adicionar")).toBeInTheDocument();
    expect(screen.getByText("Falha ao gerenciar")).toBeInTheDocument();
    expect(screen.getByText("Somente admin")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("email do usuario"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
