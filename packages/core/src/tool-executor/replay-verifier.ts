import type { ParameterBoundActionToken } from '../token-broker/types.js';

export function verifyJtiUnused(
  token: ParameterBoundActionToken,
  used_jtis?: ReadonlySet<string>,
): boolean {
  if (!used_jtis || used_jtis.size === 0) {
    return true;
  }
  return !used_jtis.has(token.jti);
}

export function verifyIdempotencyKeyUnused(
  token: ParameterBoundActionToken,
  used_idempotency_keys?: ReadonlySet<string>,
): boolean {
  if (!used_idempotency_keys || used_idempotency_keys.size === 0) {
    return true;
  }
  return !used_idempotency_keys.has(token.idempotency_key);
}
