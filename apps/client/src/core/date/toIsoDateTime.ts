import { toDate } from "./toDate";

export function toIsoDateTime(value: string) {
  return toDate(value)?.toISOString();
}
