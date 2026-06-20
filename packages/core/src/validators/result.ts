export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationFailure = { ok: false; errors: string[] };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function success<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

export function failure(...errors: string[]): ValidationFailure {
  return { ok: false, errors };
}

export function mergeFailures(results: ValidationResult<unknown>[]): ValidationFailure | null {
  const errors = results.flatMap((result) => (result.ok ? [] : result.errors));
  return errors.length > 0 ? failure(...errors) : null;
}
