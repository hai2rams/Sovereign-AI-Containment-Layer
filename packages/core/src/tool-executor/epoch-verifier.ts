import type { ParameterBoundActionToken } from '../token-broker/types.js';

export function verifyRevocationEpoch(
  token: ParameterBoundActionToken,
  current_revocation_epoch: number,
): boolean {
  return token.revocation_epoch === current_revocation_epoch;
}

export function verifyContainmentEpoch(
  token: ParameterBoundActionToken,
  current_containment_epoch: number,
): boolean {
  return token.containment_epoch === current_containment_epoch;
}

export function verifyKeyEpoch(token: ParameterBoundActionToken, current_key_epoch: number): boolean {
  return token.key_epoch === current_key_epoch;
}
