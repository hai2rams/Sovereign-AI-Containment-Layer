import type { ActionProposal } from '../types/action-proposal.js';
import type { Sha256Hex } from '../types/brands.js';
import { computeParameterHash } from '../token-broker/parameter-hash.js';

export function verifyParameterHash(
  tokenParameterHash: Sha256Hex,
  execution_payload: ActionProposal,
): boolean {
  const recomputed = computeParameterHash(execution_payload);
  return recomputed === tokenParameterHash;
}
