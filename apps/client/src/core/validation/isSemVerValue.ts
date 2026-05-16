import { isValidSemVerCore } from "./isValidSemVerCore";
import { isValidSemVerIdentifierList } from "./isValidSemVerIdentifierList";
import { isValidSemVerPrerelease } from "./isValidSemVerPrerelease";

export function isSemVerValue(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  let normalizedValue = value;
  const buildSeparatorIndex = normalizedValue.indexOf("+");
  if (buildSeparatorIndex !== -1) {
    const buildMetadata = normalizedValue.slice(buildSeparatorIndex + 1);
    if (!isValidSemVerIdentifierList(buildMetadata, true)) {
      return false;
    }

    normalizedValue = normalizedValue.slice(0, buildSeparatorIndex);
  }

  if (normalizedValue.includes("+")) {
    return false;
  }

  const prereleaseSeparatorIndex = normalizedValue.indexOf("-");
  const versionCore =
    prereleaseSeparatorIndex === -1
      ? normalizedValue
      : normalizedValue.slice(0, prereleaseSeparatorIndex);
  const prereleaseValue =
    prereleaseSeparatorIndex === -1
      ? undefined
      : normalizedValue.slice(prereleaseSeparatorIndex + 1);

  return isValidSemVerCore(versionCore) && isValidSemVerPrerelease(prereleaseValue);
}
