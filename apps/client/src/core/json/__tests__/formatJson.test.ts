import { describe, expect, it } from "vitest";
import { formatJson } from "../formatJson";

describe("formatJson", () => {
  it("formats values with two-space indentation", () => {
    expect(formatJson({ enabled: true })).toBe('{\n  "enabled": true\n}');
  });
});
