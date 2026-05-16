import { describe, expect, it } from "vitest";
import { useCollectionSelection } from "../useCollectionSelection";

describe("useCollectionSelection", () => {
  it("exports a reusable collection selection hook", () => {
    expect(useCollectionSelection).toBeTypeOf("function");
  });
});
