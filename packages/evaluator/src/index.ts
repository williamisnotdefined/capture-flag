export type EvaluationContext = {
  identifier?: string;
  email?: string;
  country?: string;
  custom?: Record<string, unknown>;
};

export function evaluate<TValue>(fallbackValue: TValue): TValue {
  return fallbackValue;
}
