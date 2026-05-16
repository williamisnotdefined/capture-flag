import { formatJson } from "@core/json/formatJson";
import { describe, expect, it } from "vitest";

describe("formatJson", () => {
  it("formats values with two-space indentation", () => {
    expect(formatJson({ enabled: true })).toBe('{\n  "enabled": true\n}');
  });
});
