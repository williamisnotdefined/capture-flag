import { isValidDateParts } from "./isValidDateParts";

export function isIsoDateValue(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    return isValidDateParts(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
  }

  const dateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!dateTimeMatch) {
    return false;
  }

  return (
    isValidDateParts(dateTimeMatch[1], dateTimeMatch[2], dateTimeMatch[3]) &&
    Number(dateTimeMatch[4]) <= 23 &&
    Number(dateTimeMatch[5]) <= 59 &&
    Number(dateTimeMatch[6]) <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}
