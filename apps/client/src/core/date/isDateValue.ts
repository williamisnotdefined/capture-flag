import { isFiniteNumber } from "../validation/isFiniteNumber";
import { isIsoDateValue } from "./isIsoDateValue";

export function isDateValue(value: unknown) {
  if (isFiniteNumber(value)) {
    return true;
  }

  return typeof value === "string" && isIsoDateValue(value);
}
