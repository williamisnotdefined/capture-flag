import { isValidSemVerIdentifierList } from "./isValidSemVerIdentifierList";

export function isValidSemVerPrerelease(value: string | undefined) {
  if (value === undefined) {
    return true;
  }

  return isValidSemVerIdentifierList(value, false);
}
