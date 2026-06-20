import { verifyMockTokenSignature } from '../token-broker/mock-signer.js';
import type { ParameterBoundActionToken } from '../token-broker/types.js';

export function verifyTokenSignature(token: ParameterBoundActionToken): boolean {
  return verifyMockTokenSignature(token);
}

export function verifyTokenNotExpired(token: ParameterBoundActionToken, now_ms: number): boolean {
  const expiresAt = Date.parse(token.expires_at);
  if (Number.isNaN(expiresAt)) {
    return false;
  }
  return now_ms < expiresAt;
}

export function verifyTokenSingleUse(token: ParameterBoundActionToken): boolean {
  return token.single_use === true;
}
