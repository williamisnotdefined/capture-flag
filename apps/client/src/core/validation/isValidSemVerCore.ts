export function isValidSemVerCore(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return parts.every((part) => {
    if (!/^(0|[1-9]\d*)$/.test(part)) {
      return false;
    }

    return Number.isSafeInteger(Number(part));
  });
}
