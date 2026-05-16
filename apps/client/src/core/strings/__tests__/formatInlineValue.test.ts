import { formatInlineValue } from "@core/strings/formatInlineValue";
import { describe, expect, it } from "vitest";

describe("formatInlineValue", () => {
  it("formats unknown values for inline display", () => {
    expect(formatInlineValue(undefined)).toBe("-");
    expect(formatInlineValue("plain text")).toBe("plain text");
    expect(formatInlineValue({ enabled: true })).toBe('{"enabled":true}');
  });
});
