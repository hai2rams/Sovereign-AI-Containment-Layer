import { validateSha256Hex } from '@sovereign/core';

const ROOT_HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;

export class InvalidRootHashError extends Error {
  constructor(message = 'Root hash must match sha256:<64 lowercase hex chars>') {
    super(message);
    this.name = 'InvalidRootHashError';
  }
}

export function validateRootHash(root: string): void {
  const result = validateSha256Hex(root);
  if (!result.ok) {
    throw new InvalidRootHashError(result.errors.join('; '));
  }
  if (!ROOT_HASH_PATTERN.test(root)) {
    throw new InvalidRootHashError();
  }
}
