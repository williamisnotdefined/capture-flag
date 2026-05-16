import { describe, expect, it } from "vitest";
import { formatInlineValue } from "../formatInlineValue";

describe("formatInlineValue", () => {
  it("formats unknown values for inline display", () => {
    expect(formatInlineValue(undefined)).toBe("-");
    expect(formatInlineValue("plain text")).toBe("plain text");
    expect(formatInlineValue({ enabled: true })).toBe('{"enabled":true}');
  });
});
