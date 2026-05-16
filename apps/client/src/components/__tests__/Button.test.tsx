import { Button } from "@components/Button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("renders the default primary button and handles clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveClass("bg-primary");

    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies variant and custom classes", () => {
    render(
      <Button className="extra-class" variant="danger">
        Delete
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "bg-destructive",
      "extra-class",
    );
  });
});
