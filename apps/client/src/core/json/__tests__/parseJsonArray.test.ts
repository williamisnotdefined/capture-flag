import { parseJsonArray } from "@core/json/parseJsonArray";
import { describe, expect, it } from "vitest";

describe("parseJsonArray", () => {
  it("parses JSON arrays", () => {
    expect(parseJsonArray('[{"id":1}]', "Items")).toEqual([{ id: 1 }]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseJsonArray("", "Items")).toEqual([]);
  });

  it("throws field-specific errors", () => {
    expect(() => parseJsonArray("{}", "Items")).toThrow("Items deve ser um array JSON.");
    expect(() => parseJsonArray("not-json", "Items")).toThrow("Items deve ser um JSON valido.");
  });
});
