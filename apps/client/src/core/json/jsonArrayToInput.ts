import { formatJson } from "./formatJson";

export function jsonArrayToInput(value: unknown) {
  return formatJson(Array.isArray(value) ? value : []);
}
