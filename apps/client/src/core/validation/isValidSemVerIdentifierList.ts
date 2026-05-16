export function isValidSemVerIdentifierList(value: string, allowNumericLeadingZeros: boolean) {
  if (!value) {
    return false;
  }

  return value.split(".").every((identifier) => {
    if (!/^[0-9A-Za-z-]+$/.test(identifier)) {
      return false;
    }

    if (!allowNumericLeadingZeros && /^\d+$/.test(identifier)) {
      return /^(0|[1-9]\d*)$/.test(identifier) && Number.isSafeInteger(Number(identifier));
    }

    return true;
  });
}
