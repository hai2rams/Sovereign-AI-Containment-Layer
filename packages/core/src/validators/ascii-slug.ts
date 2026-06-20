import type { AsciiSlug } from '../types/brands.js';
import { asAsciiSlug } from '../types/brands.js';
import { failure, success, type ValidationResult } from './result.js';

const ASCII_SLUG_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/;

export function validateAsciiSlug(input: unknown): ValidationResult<AsciiSlug> {
  if (typeof input !== 'string') {
    return failure('AsciiSlug must be a string');
  }
  if (input.length === 0) {
    return failure('AsciiSlug must not be empty');
  }
  if (input.length > 64) {
    return failure('AsciiSlug exceeds maximum length of 64 characters');
  }
  if (ZERO_WIDTH_PATTERN.test(input)) {
    return failure('AsciiSlug contains zero-width characters');
  }
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    if (code < 32 || code === 127) {
      return failure('AsciiSlug contains control characters');
    }
    if (code > 126) {
      return failure('AsciiSlug contains non-ASCII characters');
    }
  }
  if (!ASCII_SLUG_PATTERN.test(input)) {
    return failure('AsciiSlug contains invalid characters');
  }
  return success(asAsciiSlug(input));
}
