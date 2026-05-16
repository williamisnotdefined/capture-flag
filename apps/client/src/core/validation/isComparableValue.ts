import { isFiniteNumber } from "./isFiniteNumber";

export type ComparableValue = boolean | number | string | null;

export function isComparableValue(value: unknown): value is ComparableValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    isFiniteNumber(value)
  );
}
