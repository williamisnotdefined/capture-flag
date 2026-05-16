import { useClipboardMessage } from "@core/hooks/useClipboardMessage";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("useClipboardMessage", () => {
  it("sets a success message after copying text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { result } = renderHook(() => useClipboardMessage({ successMessage: "Copied" }));

    await act(async () => {
      await result.current.copyText("sdk-key");
    });

    expect(writeText).toHaveBeenCalledWith("sdk-key");
    expect(result.current.copyMessage).toBe("Copied");

    act(() => {
      result.current.clearCopyMessage();
    });

    expect(result.current.copyMessage).toBe("");
  });

  it("sets an error message when clipboard access fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { result } = renderHook(() => useClipboardMessage({ errorMessage: "Copy failed" }));

    await act(async () => {
      await result.current.copyText("sdk-key");
    });

    expect(result.current.copyMessage).toBe("Copy failed");
  });
});
