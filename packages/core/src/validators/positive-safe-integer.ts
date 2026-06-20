import { failure, success, type ValidationResult } from './result.js';

export function validatePositiveSafeInteger(input: unknown): ValidationResult<number> {
  if (typeof input !== 'number') {
    return failure('Value must be a number, not string or other type');
  }
  if (!Number.isFinite(input)) {
    return failure('Value must be finite');
  }
  if (!Number.isInteger(input)) {
    return failure('Value must be an integer, not a float');
  }
  if (!Number.isSafeInteger(input)) {
    return failure('Value must be a safe integer');
  }
  if (input <= 0) {
    return failure('Value must be positive');
  }
  return success(input);
}

export function validateNonNegativeSafeInteger(input: unknown): ValidationResult<number> {
  if (typeof input !== 'number') {
    return failure('Value must be a number');
  }
  if (!Number.isSafeInteger(input)) {
    return failure('Value must be a safe integer');
  }
  if (input < 0) {
    return failure('Value must be non-negative');
  }
  return success(input);
}
