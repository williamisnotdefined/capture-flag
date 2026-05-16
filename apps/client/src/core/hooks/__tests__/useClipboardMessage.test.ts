import { describe, expect, it } from "vitest";
import { useClipboardMessage } from "../useClipboardMessage";

describe("useClipboardMessage", () => {
  it("exports a reusable clipboard hook", () => {
    expect(useClipboardMessage).toBeTypeOf("function");
  });
});
