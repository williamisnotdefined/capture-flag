import { describe, expect, it } from "vitest";
import { formatDateTime } from "../formatDateTime";

describe("formatDateTime", () => {
  it("formats a date-time value with the pt-BR short format", () => {
    const value = "2026-05-12T10:30:00.000Z";
    const expected = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));

    expect(formatDateTime(value)).toBe(expected);
  });
});
