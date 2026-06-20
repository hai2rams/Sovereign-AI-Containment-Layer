/** M0 placeholder — structural validation hooks (M1). */
export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export function placeholderValidate(_value: unknown): ValidationResult {
  return { ok: true };
}
