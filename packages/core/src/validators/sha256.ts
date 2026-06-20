import type { Sha256Hex } from '../types/brands.js';
import { asSha256Hex } from '../types/brands.js';
import { SHA256_HEX_LENGTH, SHA256_PREFIX } from '../types/hashes.js';
import { failure, success, type ValidationResult } from './result.js';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

export function validateSha256Hex(input: unknown): ValidationResult<Sha256Hex> {
  if (typeof input !== 'string') {
    return failure('SHA-256 hash must be a string');
  }
  if (!input.startsWith(SHA256_PREFIX)) {
    return failure('SHA-256 hash must use sha256: prefix');
  }
  const hex = input.slice(SHA256_PREFIX.length);
  if (hex.length !== SHA256_HEX_LENGTH) {
    return failure('SHA-256 hash must contain exactly 64 hex characters');
  }
  if (/[A-F]/.test(hex)) {
    return failure('SHA-256 hash hex must be lowercase');
  }
  if (!SHA256_PATTERN.test(input)) {
    return failure('SHA-256 hash format is invalid');
  }
  return success(asSha256Hex(input));
}
