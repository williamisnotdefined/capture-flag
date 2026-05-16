export function parseJsonArray(value: string, fieldLabel: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(normalizedValue);
    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }
  } catch {
    throw new Error(`${fieldLabel} deve ser um JSON valido.`);
  }

  throw new Error(`${fieldLabel} deve ser um array JSON.`);
}
